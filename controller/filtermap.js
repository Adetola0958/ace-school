//Map and Filter
let fruit = [
    {
        name : "Orange",
        qty : 5,
        seed : [
            1, 2, 5
        ]
    },
    {
        name : "Apple",
        qty : 15,
        seed : [
            2, 4, 5
        ]
    },
    {
        name : "Orange",
        qty : 10,
        seed : [
            3, 3, 8
        ]
    }
]
let findFruit = fruit.map(f => {
    f.seed = f.seed.filter(e => {
        return e > 4
    }) 
    return f
})
console.log(findFruit)

//Map and Sort
let arr = [
    {
        name : "Wale",
        likes : [
            {
                type : "playing"
            },
            {
                type : "drinking"
            },
            {
                type : "arraying"
            }
        ]
    },
    {
        name : "Nonso",
        likes : [
            {
                type : "playing"
            },
            {
                type : "drinking"
            },
            {
                type : "arraying"
            }
        ]
    }
]

let finalArray = arr.map(f => {
    f.likes = f.likes.sort((a,b) => (a.type > b.type) ? 1 : -1)
    return f
})
console.log(finalArray)