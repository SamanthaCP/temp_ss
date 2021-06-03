const { BadRequestError } = require("../utils/errors")
const { storage } = require("../data/storage")

const formatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatPrice = (amount) => {
  // const dollars = amount * 0.01
  return `$${formatter.format(amount)}`
}

class Store {
  static async listProducts() {
    // code goes here
    return storage.get("products").value()
  }

  static async purchaseProducts(cart, userInfo) {
    if (!cart) {
      throw new BadRequestError(`No cart found to checkout.`)
    }
    if (!userInfo) {
      throw new BadRequestError(`No user info found to checkout with.`)
    }
    const products = storage.get("products").value()
    const subtotal = Store.calculateSubtotal(cart, products)
    const total = Store._totalWithTax(subtotal)

    const receipt = Store.createReceipt({ cart, subtotal, total, products, userInfo })

    const purchase = {
      name: userInfo.name,
      email: userInfo.email,
      total,
      receipt,
    }

    storage.get("purchases").push(purchase).write()

    return purchase
  }

  /**
   * Method that calculates the total cost of all items in the cart, before tax
   *
   * @returns number
   */
  static calculateSubtotal(cart, products) {
    const productsMapping = products.reduce((acc, product) => {
      acc[product.name] = product
      return acc
    }, {})

    let subtotal = 0
    for (let productName in cart) {
      if (!productsMapping[productName]) {
        throw new BadRequestError(`Item: ${productName} is not in the Student Store inventory.`)
      }
      const product = productsMapping[productName]
      const quantity = cart[productName]
      const productSubtotal = quantity * product.price
      subtotal += productSubtotal
    }

    return subtotal
  }

  /**
   * Private method used to return the total with 8.875% sales tax added on.
   *
   * @returns the cost with tax included
   */
  static _totalWithTax(cost) {
    return cost + cost * Store.tax
  }

  /**
   * Method that takes the current shopping cart and returns a receipt.
   *
   */
  static createReceipt({ cart, subtotal, total, products, userInfo }) {
    const productMapping = products.reduce((acc, item) => {
      acc[item.name] = item
      return acc
    }, {})

    const productRows = Object.keys(cart).map((productName) => {
      const product = productMapping[productName]

      return {
        ...product,
        quantity: cart[productName],
        totalPrice: cart[productName] * product.price,
      }
    })

    const receiptLines = [
      `Showing receipt for ${userInfo.name} available at ${userInfo.email}:`,
      `\n\n`,
      ...productRows.map(
        (product) =>
          `${product.quantity} total ${product.name} purchased at a cost of ${formatPrice(
            product.price
          )} for a total cost of ${formatPrice(product.totalPrice)}.`
      ),
      `Before taxes, the subtotal was ${formatPrice(subtotal)}`,
      `After taxes and fees were applied, the total comes out to ${formatPrice(total)}`,
    ]

    return {
      userInfo,
      lines: receiptLines,
      productRows,
    }
  }
}

Store.tax = 0.0875

module.exports = Store
