const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function deliverToPropertyIsValid(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo != "") {
    return next();
  }
  return next({
    status: 400,
    message: "Order must include a deliverTo"
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`
    });
  }
}

function mobileNumberPropertyIsValid(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber != "") {
    return next();
  }
  return next({
    status: 400,
    message: "Order must include a mobileNumber"
  });
}

function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length <= 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish"
    });
  }
  for (let i = 0; i < dishes.length; i++) {
    dish = dishes[i]
    if ("quantity" in dish && Number.isInteger(dish.quantity) && dish.quantity > 0) {
      continue;
    } else {
      return next({
        status: 400,
        message: `dish ${i} must have a quantity that is an integer greater than 0`
      });
    }
  }
  next()
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function idMatch(req, res, next) { 
  console.log(`orderId: ${req.body.data.id}, routeId: ${req.params.orderId}`)
  if (req.body.data && req.body.data.id && req.body.data.id !== req.params.orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${req.params.dishId}`
    });
  } else {
    next();
  }
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!status || !(validStatuses.includes(status))) {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    });
  } 
  next();
}

function alreadyDelivered(req, res, next) {
  const order = res.locals.order;
  if (order.status && order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed"
    })
  }
  next();
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // update the paste
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    res.sendStatus(404);
  }
  else if (orders[index].status && orders[index].status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending."
    })
  }
  orders.splice(index, 1);
  res.sendStatus(204);
  
}

module.exports = {
  list,
  create: [    // POST
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    deliverToPropertyIsValid,
    mobileNumberPropertyIsValid,
    dishesPropertyIsValid,
    create
  ],
  read: [      // GET
    orderExists,
    read
  ],
  update: [    // PUT
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataHas("status"),
    deliverToPropertyIsValid,
    mobileNumberPropertyIsValid,
    dishesPropertyIsValid,
    idMatch,
    statusPropertyIsValid,
    alreadyDelivered,
    update
  ],
  delete: [    // DELETE
    orderExists,
    destroy
  ]
}