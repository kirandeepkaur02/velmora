import mongoose from 'mongoose';
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendSuccess.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const addressFields = [
  'fullName',
  'phone',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country',
];

function parseAddress(body, existing = {}) {
  const address = {};
  for (const field of addressFields) {
    const value = body[field] === undefined ? existing[field] : String(body[field]).trim();
    if (field !== 'addressLine2' && !value) {
      throw new ApiError({
        statusCode: 400,
        code: 'INVALID_ADDRESS',
        message: `${field} is required.`,
      });
    }
    address[field] = value;
  }
  if (body.isDefault !== undefined && typeof body.isDefault !== 'boolean') {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_ADDRESS',
      message: 'isDefault must be a boolean.',
    });
  }
  address.isDefault = body.isDefault === undefined
    ? Boolean(existing.isDefault)
    : Boolean(body.isDefault);
  return address;
}

function serializeAddress(address) {
  return {
    id: address._id.toString(),
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
  };
}

export async function updateProfile(req, res) {
  const name = req.body?.name === undefined ? req.user.name : String(req.body.name).trim();
  const email = req.body?.email === undefined
    ? req.user.email
    : String(req.body.email).trim().toLowerCase();

  if (!name || name.length > 100 || !emailPattern.test(email) || email.length > 254) {
    throw new ApiError({
      statusCode: 400,
      code: 'INVALID_PROFILE',
      message: 'A valid name and email address are required.',
    });
  }

  const duplicate = await User.exists({ email, _id: { $ne: req.user._id } });
  if (duplicate) {
    throw new ApiError({
      statusCode: 409,
      code: 'EMAIL_IN_USE',
      message: 'An account with this email already exists.',
    });
  }

  req.user.name = name;
  req.user.email = email;
  await req.user.save();
  return sendSuccess(res, { user: req.user.toPublicJSON() });
}

export function listAddresses(req, res) {
  return sendSuccess(res, { addresses: req.user.addresses.map(serializeAddress) });
}

export async function createAddress(req, res) {
  const address = parseAddress(req.body ?? {});
  if (address.isDefault || req.user.addresses.length === 0) {
    req.user.addresses.forEach((savedAddress) => {
      savedAddress.isDefault = false;
    });
    address.isDefault = true;
  }
  req.user.addresses.push(address);
  await req.user.save();
  return sendSuccess(res, {
    address: serializeAddress(req.user.addresses.at(-1)),
  }, 201);
}

export async function updateAddress(req, res) {
  if (!mongoose.isValidObjectId(req.params.addressId)) {
    throw new ApiError({
      statusCode: 404,
      code: 'ADDRESS_NOT_FOUND',
      message: 'The requested address could not be found.',
    });
  }
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    throw new ApiError({
      statusCode: 404,
      code: 'ADDRESS_NOT_FOUND',
      message: 'The requested address could not be found.',
    });
  }

  const values = parseAddress(req.body ?? {}, address);
  if (values.isDefault) {
    req.user.addresses.forEach((savedAddress) => {
      savedAddress.isDefault = false;
    });
  }
  Object.assign(address, values);
  await req.user.save();
  return sendSuccess(res, { address: serializeAddress(address) });
}

export async function deleteAddress(req, res) {
  if (!mongoose.isValidObjectId(req.params.addressId)) {
    throw new ApiError({
      statusCode: 404,
      code: 'ADDRESS_NOT_FOUND',
      message: 'The requested address could not be found.',
    });
  }
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    throw new ApiError({
      statusCode: 404,
      code: 'ADDRESS_NOT_FOUND',
      message: 'The requested address could not be found.',
    });
  }

  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && req.user.addresses.length > 0) {
    req.user.addresses[0].isDefault = true;
  }
  await req.user.save();
  return sendSuccess(res, { addresses: req.user.addresses.map(serializeAddress) });
}
