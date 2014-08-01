# Transform javascript objects

Available for browsers and node. Will add complete README soon.

- If there are '.' symbols dots in object key - there will resolved as nested objects.

## Example

```javascript
var object = {
    id: 1,
    author: 'tuchk4',
    car: 'bmw',
    language: 'js'
};


transform(object, {
    fields: {
        author: {
            rename: 'git.developer'
        }
    }
});

transform(object, {
    exclude: ['id'],
    fields: {
        language: {
            encode: function(value){
                return 'Only ' + value + '!';
            }
        },

        car: {
            encode: function(value){
                return value + ' X5';
            }
        }
    }
});

transform(object, {
    type: 'select',
    fields: {
        car: {
            encode: function(value){
                return value + ' X5';
            }
        }
    }
});

```