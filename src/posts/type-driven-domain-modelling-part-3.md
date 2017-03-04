---
title: Type Driven Domain Modelling, part 3
lead: One More Spec Change With F#
template: post.hbt
date: 2017-03-01
tags: functional, types, fsharp, domain
draft: false
---

*This is part 3 of a series:*

* [Part 1: Types And Property Testing](http://lucasmreis.github.io/blog/type-driven-domain-modelling-part-1/)
* [Part 2: Evolving Models](http://lucasmreis.github.io/blog/type-driven-domain-modelling-part-2/)

In this third part of the series, we're gonna add a feature to the basket read model: every line will be more explicit about if it's promoted or not, and what the discount was.

## Spec

Every line and the basket itself will either have only one total value if there are no promotions applied, or it will list the *original* total value if there was no promotion, the resulting *discount*, and the *final* total value after subtracting the discount from the original total.

## Evolving The Types

To achieve the new spec, we don't need to change the Product or the Event. In *CQRS* terms, we don't need to change the *Command* side, only the *Read* side.

Let's first define a type `ReadTotal`, that expresses the totals we need to show the user according to the new spec:

```fsharp
type ReadTotal =
    | NotPromoted of Price
    | Promoted of original: Price * discount: Price * final: Price
```

There we have it: a `NotPromoted` total that only stores the price, or a `Promoted` total, that stores both the price before and after the promotion (`original` and `final`) and the discount.

Now let's see it in our read models:

```fsharp
type Line = {
    productSku: Sku
    quantity: Qty
    lineTotal: ReadTotal
}

type Basket = {
    lines: Line list
    total: ReadTotal
}

let empty = { lines = [] ; total = NotPromoted 0 }
```

That's everything we need with our types, now let's go to the functions.

## Adapting The Functions

First, I'm going to rename `promotedTotal` to `promotedFinalTotal` - that's more descriptive of what the function does now:

```fsharp
// only changed the function's name
let promotedFinalTotal quantity price promotion =
    let promotedQty = quantity / promotion.promoQty
    let promotedTotal = promotedQty * promotion.promoPrice

    let notPromotedQty = quantity % promotion.promoQty
    let notPromotedTotal = notPromotedQty * price

    promotedTotal + notPromotedTotal
```

And then we reimplement `promotedTotal`. This function will calculate the promoted total, and the total without promotion. If the values are different, it returns a `Promoted`. If the values are not different, it returns a `NotPromoted`:

```fsharp
let promotedTotal quantity price promotion =
    let final = promotedFinalTotal quantity price promotion
    let original = quantity * price

    if final <> original
    then Promoted(original, original - final, final)
    else NotPromoted(final)
```

Easy! Now we adapt the `lineTotal` function to return `ReadTotal`:

```fsharp
let lineTotal quantity product =
    match product.promotion with
    | None -> NotPromoted(quantity * product.price)
    | Some promotion -> promotedTotal quantity product.price promotion
```

And we're done with all the line refactoring :) If we compile the project now, we see that we only have to adapt `basketTotal` to sum the totals of all the lines. Let's do it.

## Summing ReadTotals

Let's have a look at the current `basketTotal` implementation:

```fsharp
let basketTotal lines =
    lines
    |> List.map (fun l -> l.lineTotal)
    |> List.sum
```

`List.sum` is a simple function that sums all the ints from a list. Another way we could sum the ints could be:

```fsharp
let basketTotal lines =
    lines
    |> List.map (fun l -> l.lineTotal)
    |> List.fold (+) 0
```

This works the same way, but exposes a more generic syntax that we can take advantage. `(+)` is the function that sums two ints, and `0` is an "initial" int; that means that, to adapt this function to `ReadTotal` instead of int, we only need to implement a function that sums two `ReadTotal`, and an initial total!

To sum two `ReadTotal`, we have to take into account that both could be either `NotPromoted` or `Promoted`. I'll implement it as four case pattern match, and if you have a better idea, please write it in the comments!

```fsharp
let sumTotals t1 t2 =
    match t1, t2 with
    | NotPromoted v1, NotPromoted v2 -> NotPromoted(v1 + v2)
    | NotPromoted v, Promoted(o, d, f) -> Promoted(v + o, d, v + f)
    | Promoted(o, d, f), NotPromoted v -> Promoted(v + o, d, v + f)
    | Promoted(o1, d1, f1), Promoted(o2, d2, f2) -> Promoted(o1 + o2, d1 + d2, f1 + f2)

let basketTotal lines =
    lines
    |> List.map (fun l -> l.lineTotal)
    |> List.fold sumTotals (NotPromoted 0)
```

And our new domain is ready! Just run the `Experiments.fsx` script we wrote last part, and see the results :)

## Updating The Tests

For the "promoted line total" test, we need now to build both the `Promoted` and `NotPromoted` expected results:

```fsharp
testProperty "promoted line total" <| fun (N : Qty) ->
    let price = 10
    let promotedPrice = 7

    let promoQty = N + 2us
    let promotion = { promoQty = promoQty ; promoPrice = promotedPrice }
    let promoted = promotedTotal promoQty price promotion

    let notPromoQty = N + 1us
    let notPromoted = promotedTotal notPromoQty price promotion

    let promotedExpected = Promoted(promoQty * price, promoQty * price - promotedPrice , promotedPrice)
    let notPromotedExpected = NotPromoted(notPromoQty * price)

    Expect.equal promoted promotedExpected "same price as promotion"
    Expect.equal notPromoted notPromotedExpected "multiplied by regular price"
```

We can test also that adding any quantity of not promoted products to a basket with non promoted lines result in a non promoted basket:

```fsharp
testProperty "not promoted products added to not promoted" <| fun (N : Qty) ->
    let initial = {
        lines = [{ productSku = "a" ; quantity = 3us ; lineTotal = NotPromoted 30 }]
        total = NotPromoted 30
    }
    let prod = { sku = "sku" ; price = 10 ; promotion = None }
    let event = AddToBasket(prod, 1us)

    let basket =
        [1..(int N + 1)]
        |> List.map (fun _ -> event)
        |> List.fold update initial

    let isNotPromoted =
        match basket.total with
        | NotPromoted _ -> true
        | Promoted _ -> false

    Expect.isTrue isNotPromoted "should stay not promoted"
```

We can also test that adding any quantity of not promoted products to a basket with a promoted line results in a promoted basket, with the same discount as before:

```fsharp
testProperty "not promoted products added to promoted" <| fun (N : Qty) ->
    let initial = {
        lines = [{ productSku = "a" ; quantity = 3us ; lineTotal = Promoted(30, 11, 19) }]
        total = Promoted(30, 11, 19)
    }
    let prod = { sku = "sku" ; price = 10 ; promotion = None }
    let event = AddToBasket(prod, 1us)

    let basket =
        [1..(int N + 1)]
        |> List.map (fun _ -> event)
        |> List.fold update initial

    let isPromoted =
        match basket.total with
        | NotPromoted _ -> false
        | Promoted(_, discount, _) ->
            // asserting here; I know, not very elegant :(
            Expect.equal discount 11 "discount is the same"
            true

    Expect.isTrue isPromoted "should stay promoted"
```

I think these tests are enough to give a lot of confidence in the code, but of course they don't assure absolute correctness. So, if you have any other ideas for interesting properties to test, please write it in the comment section!

## Conclusions

Now we have a function that transforms a list of events into a relatively complex basket. I really like how code is very declarative, and are very self explanatory. The type system definitely contributes to that. This, combined with the propoerty tests, make me feel very confident of the *correctness* of this code.

Summarizing: I'm completely sold to ML languages now :) Not only I tend to find my code more reliable and safe, it's also more concise *and* readable. After these months experimenting with Elm and F#, I think that ML languages bring all the benefits of a dynamic functional language like Clojure, and take it to a whole new level.

## Next Steps

That is my "planned last part" of this series. But this exercise could go in two different directions now: either building an actual application using this domain model, say a web API; or evolving the domain model, by adding either new commands or read models. Feel free to share any ideas you have!