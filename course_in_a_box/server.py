import http.server
import socketserver, os

# try to duplicate GITHUB's markdown css...
md_prologue = b"""<!DOCTYPE html>
<html>
  <head>
    <title>Computation Structures</title>
    <script> MathJax = { tex: { inlineMath: [['$','$']]}}; </script>
    <script src="labs/tools/MathJax/tex-chtml.js" id="MathJax-script" async></script>
    <script src="labs/tools/github.js"></script>
    <link rel="stylesheet" href="labs/tools/github.css"/>
  </head>
  <body>
    <article class="markdown-body">
"""

md_epilogue = b"""
    </article>
  </body>
</html>
"""

# add some extra processing when serving .MD files
class MyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, request, client_address, server, directory=None):
        # serve .md files as html
        self.extensions_map['.md'] = 'text/html'
        super().__init__(request, client_address, server, directory=directory)

    def do_GET(self):
        path = self.translate_path(self.path)
        if path.endswith('.md'):
            # read in contents of MD file
            # NB: our MD files use HTML instead markdown markup
            try:
                f = open(path, 'rb')
                md_contents = f.read()
                f.close()
            except:
                self.send_error(http.server.HTTPStatus.NOT_FOUND, 'File not found')
                return

            # add prologue and epilog
            md_contents = md_prologue + md_contents + md_epilogue

            # send whole shebang as an HTML response
            self.send_response(http.server.HTTPStatus.OK)
            self.send_header("Content-type", 'text/html')
            self.send_header("Content-Length", str(len(md_contents)))
            self.end_headers()
            self.wfile.write(md_contents)
        else:
            super().do_GET()

PORT = 6004
with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
