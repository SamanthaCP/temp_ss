const express = require("express")
const Store = require("../models/store")
const router = express.Router()

router.get("/", async (req, res, next) => {
  try {
    const products = await Store.listProducts()
    res.status(200).json({ products })
  } catch (err) {
    next(err)
  }
})

router.post("/", async (req, res, next) => {
  try {
    const cart = req.body.cart
    const userInfo = req.body.userInfo
    const purchase = await Store.purchaseProducts(cart, userInfo)
    res.status(200).json({ purchase, cart })
  } catch (err) {
    next(err)
  }
})

module.exports = router
