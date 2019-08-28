# Api Interface

This is a tool to generate type safe and simple interfaces that wrap around
remote API interfaces.

`npm install @paulpopat/api-interface --save`

It is recomended that you use my type checking library with this, but it is not essential.

`npm install @paulpopat/safe-type --save`

To use it, you simply do as so:

```JavaScript
import GenerateInterface from "@paulpopat/api-interface";
import { IsString } from "@paulpopat/safe-type";

const interface = GenerateInterface(
    {
        authenticate: {
            method: "GET",
            url: "api/auth",
            parameters: { username: IsString, password: IsString },
            returns: IsString
        }
    },
    {
        base: "http://localhost:8080/",
        // Optional
        headers: {
            Accept: "application/json"
        }
    }
);

// I have never actually used this password ;)
await interface.authenticate({ username: "paulpopat", password: "paul123" });
```

For more information, please consult the typings for the project.
