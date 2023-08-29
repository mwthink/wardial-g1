# wardial-g1
I got a strange text message directing me to take a survey on Texas politics at a specific URL. The URL had my phone number encoded as part of it.
Out of curiosity, I copied the URL to an incognito browser to avoid any cookie tracking and replaced some digits in the phone number and got taken to a boring page.

With a real phone number, you are redirected to a political survey and a full-name is revealed. G1Research has presented a wardialing opprotunity; lets dive in.

## Findings
Arbitrary check with `curl` yeilds a timeout
```sh
% phonenumber="9401234567"
% curl -v http://g1research.com/${phonenumber}

*   Trying 45.79.20.74:80...
* Connected to g1research.com (45.79.20.74) port 80 (#0)
> GET /${phonenumber} HTTP/1.1
> Host: g1research.com
> User-Agent: curl/7.88.1
> Accept: */*
>
* Recv failure: Operation timed out
* Closing connection 0
curl: (56) Recv failure: Operation timed out
```

Setting a non-`curl` user-agent header gets a response.
With a non-valid phone number, it's a 302 redirect to the URL root.
```sh
% phonenumber="9401234567"
% curl -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36" -v http://g1research.com/${phonenumber}

*   Trying 45.79.20.74:80...
* Connected to g1research.com (45.79.20.74) port 80 (#0)
> GET /${phonenumber} HTTP/1.1
> Host: g1research.com
> Accept: */*
> User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36
>
< HTTP/1.1 302 Found
< Date: Thu, 24 Aug 2023 00:18:43 GMT
< Server: Apache/2.4.25 (Debian)
< Location: http://g1research.com
< Content-Length: 0
< Content-Type: text/html; charset=UTF-8
<
* Connection #0 to host g1research.com left intact
```

Setting the user-agent header in combination with a real, valid phone number yeilds a redirect elsewhere:
```sh
% phonenumber="9401234567"
% curl -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36" -v http://g1research.com/${phonenumber}

*   Trying 45.79.20.74:80...
* Connected to g1research.com (45.79.20.74) port 80 (#0)
> GET /${phonenumber} HTTP/1.1
> Host: g1research.com
> Accept: */*
> User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36
>
< HTTP/1.1 301 Moved Permanently
< Date: Thu, 24 Aug 2023 00:20:21 GMT
< Server: Apache/2.4.25 (Debian)
< X-Robots-Tag: noindex
< Location: https://g1.cawi.idsurvey.com/default.cshtml?id=01152bdb-1a5f-412e-a6b5-b9e97671b536&idc=430d86d3-0212-4e73-a368-5e9663302859
< Content-Length: 0
< Content-Type: text/html; charset=UTF-8
<
* Connection #0 to host g1research.com left intact
```

This _elsewhere_ is a survey where my first/last name was presented with no further verification.

The script contained in this repo will wardial this server with a given area code prefix and save off the redirect location it receives from the server.

-----
Launching one of these entrypoint URLs takes you to a page with a _Next_ button.

Clicking this button triggers this Javascript:
```js
$("#next").on("click", function (e) {
e.preventDefault();
var json = {
    _type: "action",
    _action: "start_interview",
    _param: JSON.stringify("{}")
};

$.ajax({
    url: "/connectors_sessions.axd",
    dataType: "json",
    data: $.param(json),
    success: function (json) {

        if (json.status == 200) {
            self.location.href = json.path + ".cshtml";
        }
        else if (json.status == 210) {
            var json = {
                _type: "action",
                _action: "restore_testmode",
                _param: JSON.stringify("{}")
            };

            $.ajax({
                url: "/connectors.axd",
                dataType: "json",
                data: $.param(json),
                success: function (json) {
                    window.location = "/default.cshtml?id=xxxxx-xxxxx-xxxxx-xxxxx";
                }
            });
        }
        else
            _handleError(json.message);
    }
});
```

While it would be possible for us to construct the URL where the survey will be prior to this point, attempting to access it results in a message about not having an activated survey.
The above call to `start_interview` is necessary to "activate the survey" and make the page return actual content.
