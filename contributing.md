#Coding Style
* Always use semicolons
* 2 spaces as tabs (no actual tab characters allowed)
* Double quote strings only (ie. "string" not 'string')
* Comments explain what & why you are doing something if its not obvious
* If-statement logic must be wrapped in brackets
```
  //Ok
  if (1 === 1) {
    console.log("ok!");
  }
  //Not ok
  if (1 === 1)
    console.log("ok!");
```
* Don't add `console.log` anywhere, unless you're adding debugging functionality that is disabled by default
* Leading `_` on function names for private functions