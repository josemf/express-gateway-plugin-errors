# express-gateway-plugin-errors
An express gateway plugin and policy for error formatting and handling.

## Installation

Type from your shell environment:

```bash
eg plugin install express-gateway-plugin-errors
```

A PR is pending approval in `express-gateway` that is required to enable all features for this plugin. So until it's approved you can install a custom `express-gateway` from my repo fork: https://github.com/josemf/express-gateway.

## Why

This plugin serves three different app development requirements that occur very often in API development and composition:

* It's required every response from the gateway is in JSON format;
* We need to format errors in a unified way, even if we're composing from different sets of API backends, that report errors in different formats 
* Error messages should be enforced by the backend—in this scenario the app is dumb and just notifies whatever error message the API gateway sends.

## Quick start

1. Make sure the plugin is listed in [system.config.yml file](https://www.express-gateway.io/docs/configuration/system.config.yml/).
This is done automatically for you if you used the command above.

2. Add error handling configuration to [gateway.config.yml file](https://www.express-gateway.io/docs/configuration/gateway.config.yml/).

```yaml
- errors:
  - action:
    template: '{ "status": "$status", "message": "$message" }'
    defaults:
      status: NOK
      message: Internal Server Error
    messages:
      Internal Server Error: Oops... Please try again
      Validation Error: Some fields have validation errors
```

3. Enable `selfHandleResponse` in **proxy** configuration to pass through backend responses—makes it possible handle error responses.

```yaml
- proxy:
  - action:
    serviceEndpoint: your-service-endpoint
    changeOrigin: true
    selfHandleResponse: true
```

### Configuration Parameters

By default if no parameter have been declared, the plugin will enforce every response from the backend to be JSON format. By itself this might be useful if the app was built in a way that expects every response to be JSON.

Express gateway outputs most of this errors in `text/plain`. For example if we setup `key-auth` authorization and the app sends an invalid key token `express-gateway` will respond with:

```
Unauthorized
```

Just by enabling the policy in some policy list will make `express-gateway` to respond with:

```json
{
  "status": "NOK",
  "message": "Unauthorized"
}
```

#### template:

This makes possible to customize the response JSON structure `express-gateway` sends as a response. Example:

```yaml
- errors:
  - action:
    template: '{ "success": "$status", "message": "$message", "error": "$code", "exception": "$trace", "file": "$file", "line": "$line" }'
```

In this example is it expected proxied backend to return something errors in the following structure:

```json
{
  "status": false,
  "message": "Something went wrong...",
  "code": "internal_server_error",
  "trace": [ ... ],
  "file": "some_file_path",
  "line": 89
}
```

Having the template rule applied would result in this response:

```json
{
  "success": false,
  "message": "Something went wrong...",
  "error": "internal_server_error",
  "exception": [ ... ],
  "file": "some_file_path",
  "line": 89
}
```

#### defaults:

Some times it's possible the backend is not sending everything. For those cases we setup defaults:

```yaml
defaults:
  success: false
  error: 500_error
  message: Oopsie
```

#### messageField:

The JSON `message` is special. For example if the proxied backend sends `text/plain` we should know the field name to fill with its response content

```yaml
messageField: message
```

#### debugFields:

Some response fields can be showned depending on env `LOG_LEVEL=debug`:

```yaml
debugFields:
  - exception
  - file
  - line
```

#### restrictErrors:

Some times we don't control the proxied service backend, and we should not trust error messages it sends:

```yaml
restrictErrors: true
```

Only listed messages in the `messages:` option dictionary will be sent through, if it's not found there a default message in `defaults:` will be sent.

#### messages:

This will map error messages received from the proxied backend to the ones we want to send to our app:

```yaml
 messages:
   Internal Server Error: Oops... Please try again
   Validation Error: Some fields have validation errors
   Unauthorized: Please login again...
```

#### filters:

This is a more sophisticated way to map messages between error responses and what we want to send to apps, using regular expressions:

```yaml
filters:
  -
    regex: ^Found an error in (\s+) module
    error: "module_error"
    message: "Module $1 error"
```

It will do regex capture and substitution with `$N` format.

## What is missing

There are a few other things that depending on specific requirement needs I might have on the future or the demand this plugin might attract that I'm willing to pursue:

* Error reporting to external proxied service endpoint
* Converting errors to other formats

Ofcourse any contribution is appreciated! 