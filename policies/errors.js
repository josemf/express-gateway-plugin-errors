const OutputJsonSender = require('./output_json_sender');

module.exports = {
    name: 'errors',
    schema: {
        $id: 'http://express-gateway.io/schemas/policies/errors.json', 
        type: 'object',
        properties: {

            template: {
                type: "string",                
                default: '{ "status": "$status", "message": "$message", "code": "$code", "exception": "$exception" }'
            },

            defaults: {
                type: "object",
                default: { status: "NOK", message: "Server Error" }
            },

            debugFields: {
                type: "array",
                items: {
                    type: "string"
                }
            },

            messageField: {
                type: "string"
            },
            
            filters: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        regex: {
                            type: "string"
                        } 
                    }   
                }  
            },
 
            messages: {   
                type: "object"                
            },
 
            restrictErrors: {  
                type: "boolean", 
                default: true
            }
        }
    },
    policy: (actionParams) => { 

        const output = new OutputJsonSender(actionParams);

        return (req, res, next) => {

            output.response(res); 

            // Monkey patch res.send
            
            res.send = new Proxy(res.send, {
                apply: (fn, thisArg, args) => {
                    
                    if(res.statusCode === 200) {
                        return fn.apply(res, args);
                    }
                    
                    return output.return(args[0]); 
                } 
            });    

            next();  
        }; 
    }
};
