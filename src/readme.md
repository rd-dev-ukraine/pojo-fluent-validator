# pojo-fluent-validator

`pojo-fluent-validator` is javascript library used to check and convert _plain old javascript objects_ with fluent configuration syntax.

__NOTE__: Validator works with *plain old javascript objects* only. That means no classes, no functions, no prototypes - it works with object literals, primitive types and arrays. 
Validator doesn't change source object, instead it makes a copy of the object but doesn't call constructor and don't copy prototype. 

## Features

* Validates and converts primitive types - numbers, strings, and any type - with custom validation rule. 
* Validates objects by validating each object property.
* Validates hashes (maps) - objects where each property value has the same structure.
* Validates arrays of primitive types or objects.
* Composability - validators for complex objects uses regular validators, so nested value can be object, array, hash or primitive type.
* Fluent syntax - validation rules are configured using chained method calls.

## Usage

### Installation
```
npm install pojo-fluent-validator
```

Single value validation example.

``` javascript
import { validateWithPromise as validate, rules } from "pojo-fluent-validator";


const rule = rules.num().must(v => v > 0, { errorMessage: "Must be greater than zero!" });

validate("10", rule).then(v => {
    // Value successfuly converted to number and validated
    console.log(v, v + 2); // Outputs 10 12
}).catch(err => { 
    // Don't reach this point until value is invalid.
});

validate("sdf", rule).then(v => {
    // Value is invalid number, then block is not executed
).catch(err => {
    // err[""] contains validation messages for whole object
    console.log(err[""]); // Outputs ["Value is not a valid number"]
});

```

Object validation example. Shows validator composability.


``` javascript
import { validateWithPromise as validate, rules } from "pojo-fluent-validator";


const positiveNumberRule = rules.num().must(v => v > 0);

const productRule = rules.obj({
    // Use previously defined rule
    id: positiveNumberRule,
    // Or inlined rule
    title: rules.str().notEmpty(),
    // Rule can be extended with additional conditions using fluent syntax.
    // .required() call need to fail on null values. Number validator by default passes nulls.    
    vendorPrice: positiveNumberRule.required(),
    // Second parameter of `must` rule is validating object
    // Inside .must(..) check we don't assume retailPrice can be null.
    // That's because required() rule stop rule chain on fail.
    // To control this use { stopOnFailure: false } as rule options.
    retailPrice: positiveNumberRule.required()
        .must((v, product) => product.retailPrice > product.vendorPrice, 
            { errorMessage: "Product should be profitable" })
});


// Valid object 
validate({
    id: 1,
    title: "Melon",
    // rules.num() parses number by default. 
    vendorPrice: "12.3",
    retailPrice: 14.44
}, productRule).then(p => {
    // Product successfuly validated
    // p.vendorPrice is now number.
    console.dir(p); 
}).catch(err => { 
    // Don't reach this point until value is invalid.
});

// Valid object 
validate({
    id: 1,
    title: "Melon",
    // rules.num() parses number by default. 
    vendorPrice: "12.3",
    retailPrice: 4.44
}, productRule).then(p => { })
.catch(err => { 
    // err is hash of "path.to.error.property.or[index]": ["validation", "messages"]
    console.log(err["deliveryPrice"]); // Outputs ["Product should be profitable"] 
});

```

Array validation

``` javascript
import { validateWithPromise as validate, rules } from "pojo-fluent-validator";

const numArrayRule = rules.arr(
        rules.num().required().must(v => v > 0));

validate([1, 2, "3"], numArrayRule)
    .then(arr => {
        // Array validated. Third element converted from string.
        console.log(arr); // Outputs [1, 2, 3]
    });

validate([1, 2, "three"],  numArrayRule)
    .catch(err => {
        // For arrays error path is "[2]"
        console.log(err["[2]"]); // Outpus ["Value is not a valid number"] 
    }); 

```

Array of objects validation

``` javascript
import { validateWithPromise as validate, rules } from "pojo-fluent-validator";

const objArrayRule = rules.arr(
        rules.obj({
            id: rules.num().required(),
            title: rules.str().required()
        }).required() // rule.obj passes null values by default
          .expandable() // Expandable object allows to have extra non-validatable properties
    );

const invalidArray = [{
    id: 1,
    title: "First"
}, {
    id: null,
    title: "Second"
}];

validate(invalidArray, objArrayRule)
    .catch(err => {
        // Rules pathes are nested in the way of plain javascript access operations
        console.log(err["[1].id"]); // Outputs ["Value is required"]
    });
```
