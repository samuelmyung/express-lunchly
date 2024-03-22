"use strict";

/** Routes for Lunchly */

const express = require("express");

const { BadRequestError } = require("./expressError");
const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();


/** Homepage: show list of customers. */
router.get("/", async function (req, res, next) {
  let customers;
  if (!req.query.search) {
    customers = await Customer.all();
  } else {
    customers = await Customer.search(req.query.search);
  }
  return res.render("customer_list.jinja", { customers });

});


/** Show a list of our top 10 customers by reservation */
router.get("/top-ten", async function (req, res, next) {
  const customers = await Customer.getBestCustomers();
  return res.render("customer_list.jinja", { customers });
});


/** Form to add a new customer. */
router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.jinja");
});


/** Handle adding a new customer. */
router.post("/add/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }

  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});


/** Show a customer, given their ID. */
router.get("/:id/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();

  return res.render("customer_detail.jinja", { customer, reservations });
});


/** Show form to edit a customer. */
router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.jinja", { customer });
});


/** Handle editing a customer. */
router.post("/:id/edit/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;

  await customer.save();

  return res.redirect(`/${customer.id}/`);
});


/** Handle adding a new reservation. */
router.post("/:id/add-reservation/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }

  if (isNaN(Date.parse(req.body.startAt))){
    throw new BadRequestError("Invalid Date Format");
  }


  const customerId = req.params.id;
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;


  const reservation = new Reservation({
    customerId,
    startAt,
    numGuests,
    notes,
  });
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});


/** Renders page for reservation edit form */
router.get("/:id/edit-reservation/:reservationId", async function (req, res, next) {
  const reservation = await Reservation.getReservationById(req.params.reservationId);

  reservation.startAt = new Date(reservation.startAt);

  res.render("reservation_edit_form.jinja", { reservation });
});


/** Handles edit a reservation  */
router.post("/:id/edit-reservation/:reservationId", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }

  const reservation = await Reservation.getReservationById(req.params.reservationId);
  reservation.customerId = req.params.id;
  reservation.startAt = new Date(req.body.startAt);
  reservation.numGuests = req.body.numGuests;
  reservation.notes = req.body.notes;

  await reservation.save();

  return res.redirect(`/${req.params.id}/`);
});

module.exports = router;
