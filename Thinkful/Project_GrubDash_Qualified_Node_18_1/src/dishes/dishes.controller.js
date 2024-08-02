const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: dishes });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`
  })
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`
    });
  }
}

function namePropertyIsValid(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name == "") {
    return next({
      status: 400,
      message: "Dish must include a name"
    });
  }
  return next();
}

function descriptionPropertyIsValid(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description == "") {
    return next({
      status: 400,
      message: "Dish must include a description"
    });
  }
  return next();
}

function imageUrlPropertyIsValid(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url == "") {
    return next({
      status: 400,
      message: "Dish must include a image_url"
    });
  }
  return next();
}

function isInteger(s) {
  return !isNaN(s) && (s === parseFloat(s)) && s >= 0;
}

function pricePropertyIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (isInteger(price)) {
    return next();
  }
  return next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0"
  });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: Number(price),
    image_url: image_url
  }
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function idMatch(req, res, next) { 
  if (req.body.data && req.body.data.id && req.body.data.id !== req.params.dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`
    });
  } else {
    next();
  }
}

function update(req, res, next) {
  //console.log(`price: ${req.body.data.price}, type: ${typeof(req.body.data.price)}`)
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  
  dish.name = name;
  dish.description = description;
  dish.price = Number(price);
  dish.image_url = image_url;
  
  res.json({ data: dish });
}

module.exports = {
  list,
  read: [   // GET
    dishExists,
    read
  ],
  dishExists,
  create: [  // POST
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    namePropertyIsValid,
    descriptionPropertyIsValid,
    pricePropertyIsValid,
    imageUrlPropertyIsValid,
    create
  ],
  update: [  // PUT
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    namePropertyIsValid,
    descriptionPropertyIsValid,
    pricePropertyIsValid,
    imageUrlPropertyIsValid,
    idMatch,
    update
  ],
  // DELETE: dishes cannot be deleted
}