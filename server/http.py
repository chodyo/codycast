from BaseHTTPServer import BaseHTTPRequestHandler
from StringIO import StringIO
import time

class HttpManager(BaseHTTPRequestHandler):
	""" Parser that parses an expected HTTP request. """

	def __init__(self, request_text, debug):
		self.rfile = StringIO(request_text)
		self.raw_requestline = self.rfile.readline()
		self.error_code = self.error_message = None
		try:
			self.parse_request()
		except AttributeError:
			self.Fail = True
			return
		else:
			self.Fail = False

		self.debug = debug
		self.printInit()

	def create_response(self,code,conttype,mod,entity_body):
		self.response_text = (
			'HTTP/1.1 ' + str(code) + ' ' + self.code_to_phrase(code) + '\r\n'
			'Date: ' + self.date() + '\r\n'
			'Server: codycast\r\n'
			'Content-Type: ' + str(conttype) + '\r\n'
			'Content-Length: ' + str(len(entity_body)) + '\r\n'
			'Last-Modified: ' + str(mod) + '\r\n'
			'\r\n' + entity_body
			)
		self.printResponse()
		return self.response_text

	def date(self):
		t = time.time()
		gmt = time.gmtime(t)
		format = '%a, %d %b %Y %H:%M:%S GMT'
		time_string = time.strftime(format, gmt)
		return time_string

	def code_to_phrase(self,code):
		converter = {
			200 : "OK",
			400 : "Bad Request",
			403 : "Forbidden",
			404 : "Not Found",
			500 : "Internal Server Error",
			501 : "Not Implemented"
			}
		try:
			return converter[code]
		except KeyError:
			return "???"

	def printInit(self):
		if (self.error_code == None):
			self.printDebug("\n---VALID COMMAND RECEIVED---")
			try:
				self.printDebug(self.command)
				self.printDebug(self.path)
				self.printDebug(self.request_version)
				self.printDebug("--- ---")
				self.printDebug(str(len(self.headers)) + " headers found:")
				for k,v in self.headers.items():
					self.printDebug(str(k) + ": " + str(v))
				self.printDebug("---")
				# self.printDebug(self.headers.keys())
				# self.printDebug(self.headers['host'])
				# self.printDebug("range: " + self.headers['range'])
			except:
				pass
		else:
			self.printDebug("---INVALID COMMAND RECIEVED---")
			self.printDebug(self.error_code)
			self.printDebug(self.error_message)

	def printResponse(self):
		self.printDebug("---RESPONSE CREATED---")
		self.printDebug(self.response_text[0:500])
		self.printDebug("---   ---   ---   ---   ---")

	def printDebug(self,msg):
		if self.debug:
			print(msg)