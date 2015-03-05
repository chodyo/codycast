import socket
import sys

class Client:
    """ Echo client """
    def __init__(self,host,port):
        self.host = host
        self.port = port
        self.size = 1024
        self.open_socket()
        print "Enter a blank line to stop."
        sys.stdout.write('> ')

    def open_socket(self):
        """ Connect to the server """
        try:
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server.connect((self.host,self.port))
        except socket.error, (value,message):
            if self.server:
                self.server.close()
            print "Could not open socket: " + message
            sys.exit(1)

    def run(self):
        """ Read from the keyboard and send this line to the server """
        while True:
            # read from keyboard
            line = sys.stdin.readline()
            if line == '\n':
                break
            request_text = (
                'GET / HTTP/1.1\r\n'
                'Host: relative\r\n'
                'Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.3\r\n'
                'Accept: text/html;q=0.9,text/plain\r\n'
                '\r\n'
                )
            self.server.send(request_text)
            data = self.server.recv(self.size)
            sys.stdout.write(data)
            sys.stdout.write('> ')
        self.server.close()
