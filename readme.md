# pojo-fluent-validator

`pojo-fluent-validator` is javascript library used to check and convert _plain old javascript objects_ with fluent configuration syntax.

__NOTE__: Validator works with *plain old javascript objects* only. That means no classes, no functions, no prototypes - it works with object literals, primitive types and arrays. 
Validator doesn't change source object, instead it makes a copy of the object but doesn't call constructor and don't copy prototype. 

## Features

* Validates primitive types - numbers, strings. 
* Validates objects by validating each object property.
* Validates hashes (maps) - objects each element has the same structure.
* Validates arrays of primitive types or objects.
* Composability - validators for complex objects uses regular validators, so nested value can be object, array, hash or primitive type.
* Fluent syntax - validation rules are configured using chained method calls.
