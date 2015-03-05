import errno
import select
import socket
import sys
import traceback
from http import HttpManager
import os
import time

class Poller:
    """ Polling server """
    def __init__(self,port,debug):
        self.host = ""
        self.port = port
        self.open_socket()
        self.clients = {}
        self.lastevent = {}
        self.size = 1024
        self.debug = debug

        self.hosts = {'default':'/'}
        self.media = {'txt':'text/plain'}
        self.parameters = {'timeout':'1'}
        with open("web.conf") as f:
            content = [x.strip('\n') for x in f.readlines()]
            self.printDebug("Importing web.conf:")
            for line in content:
                line = line.split(" ")
                if line[0] == "host":
                    self.hosts[line[1]] = line[2]
                elif line[0] == "media":
                    self.media[line[1]] = line[2]
                elif line[0] == "parameter":
                    self.parameters[line[1]] = line[2]
        # timeout value of 0 will never time out
        self.timeout = int(self.parameters["timeout"])

        self.printDebug("  Hosts:")
        self.printDebug(self.hosts)
        self.printDebug("  Media:")
        self.printDebug(self.media)
        self.printDebug("  Parameters:")
        self.printDebug(self.parameters)

    def open_socket(self):
        """ Setup the socket for incoming clients """
        try:
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR,1)
            self.server.bind((self.host,self.port))
            self.server.listen(5)
            self.server.setblocking(0)
        except socket.error, (value,message):
            if self.server:
                self.server.close()
            print "Could not open socket: " + message
            sys.exit(1)

    def run(self):
        """ Use poll() to handle each incoming client."""
        self.poller = select.epoll()
        self.pollmask = select.EPOLLIN | select.EPOLLHUP | select.EPOLLERR
        self.poller.register(self.server,self.pollmask)
        while True:
            # poll sockets
            try:
                fds = self.poller.poll(timeout=self.timeout)
            except:
                return
            for (fd,event) in fds:
                self.lastevent[fd] = time.time()
                # handle errors
                if event & (select.POLLHUP | select.POLLERR):
                    self.handleError(fd)
                    continue
                # handle the server socket
                if fd == self.server.fileno():
                    self.handleServer()
                    continue
                # handle client socket
                result = self.handleClient(fd)
            self.markandsweep()

    def handleError(self,fd):
        self.poller.unregister(fd)
        if fd == self.server.fileno():
            # recreate server socket
            self.server.close()
            self.open_socket()
            self.poller.register(self.server,self.pollmask)
        else:
            # close the socket
            self.clients[fd].close()
            del self.clients[fd]

    def handleServer(self):
        # accept as many clients as possible
        while True:
            try:
                (client,address) = self.server.accept()
            except socket.error, (value,message):
                # if socket blocks because no clients are available,
                # then return
                if value == errno.EAGAIN or errno.EWOULDBLOCK:
                    return
                print traceback.format_exc()
                sys.exit()
            # set client socket to be non blocking
            client.setblocking(0)
            self.clients[client.fileno()] = client
            self.poller.register(client.fileno(),self.pollmask)

    def handleClient(self,fd):
        try:
            data = self.clients[fd].recv(self.size)
        except socket.error, (value,message):
            # if no data is available, move on to another client
            if value == errno.EAGAIN or errno.EWOULDBLOCK:
                return
            print traceback.format_exc()
            sys.exit()

        if data:
            self.processClientCommand(data,fd)
        else:
            self.timeoutclient(fd)

    def markandsweep(self):
        temp = self.clients.copy()
        for fd in temp:
            # check if client needs to be timed out
            try:
                timesincelastaction = time.time() - self.lastevent[fd]
                if self.timeout > 0 and timesincelastaction > self.timeout:
                    self.timeoutclient(fd)
            except KeyError:
                continue

    def processClientCommand(self,data,fd):
        # self.clients[fd].send(data)
        request = HttpManager(data, self.debug)
        if request.Fail == True:
            return

        if (request.error_code == None and request.command == "GET"):
            originalpath = request.path
            # if the last character is a slash, assume it's asking for index.html
            if request.path[-1] == '/':
                request.path = request.path + "index.html"
            # if it didn't include a host, assume it's the default host
            # if it did include a host but i don't recognize it, revert to default
            try:
                host = request.headers['host']
                self.hosts[host]
            except KeyError:
                host = "default"
            if request.path[0] == '/':
                request.path = request.path[1:]
            request.path = self.hosts[host] + '/' + request.path
            try:
                with open(request.path, 'r') as f:
                    entitybody = f.read()
                    self.printDebug("Found, opened, and read file: " + request.path)
            # couldn't find the file OR invalid access rights
            except IOError as (errno, strerror):
                ftype = "text/plain"
                lastmod = None
                if errno == 2:
                    rcode = 404
                    entitybody = "File Not Found : " + originalpath
                    self.printDebug("Could not find file: " + request.path)
                elif errno == 13:
                    rcode = 403
                    entitybody = "Forbidden : " + originalpath
                    self.printDebug("No access allowed: " + request.path)
                else:
                    rcode = 500
                    entitybody = "Internal Server Error : " + originalpath

            # got everything just fine
            else:
                rcode = 200
                ftype = self.media[request.path.split('.')[-1]]
                lastmod = self.lastmodified(request.path)

            response = request.create_response(rcode, ftype, lastmod, entitybody)

        elif request.command != "GET":
            response = request.create_response(501, "text/plain", None, "Not Implemented : " + request.command)

        elif request.error_code != None:
            response = request.create_response(request.error_code, "text/plain", "nil", request.error_message)
        
        self.clients[fd].send(response)

    def timeoutclient(self, fd):
            self.printDebug("Timing out fd: " + str(fd))
            self.poller.unregister(fd)
            self.clients[fd].close()
            del self.clients[fd]
            del self.lastevent[fd]

    def lastmodified(self, filepath):
        statbuf = os.stat(filepath)
        gmt = time.gmtime(statbuf.st_mtime)
        format = '%a, %d %b %Y %H:%M:%S GMT'
        time_string = time.strftime(format, gmt)
        return time_string

    def printDebug(self,msg):
        if self.debug:
            print msg