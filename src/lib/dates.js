'use strict';

const dayjs = require('dayjs');
require('dayjs/locale/pl');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween');
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Czy promocja jest aktywna teraz (kind timed: przedział; kind weekly: dzień tygodnia). */
function isPromoLive(promo, now = dayjs()) {
  if (!promo || !promo.is_active) return false;
  if (promo.kind === 'weekly') {
    // weekday 1=pon..7=nd
    const isoDow = now.day() === 0 ? 7 : now.day();
    return !promo.weekday || promo.weekday === isoDow;
  }
  const startsOk = !promo.starts_at || now.isAfter(dayjs(promo.starts_at));
  const endsOk = !promo.ends_at || now.isBefore(dayjs(promo.ends_at));
  return startsOk && endsOk;
}

function formatDate(value, fmt = 'D MMMM YYYY', locale = 'pl') {
  if (!value) return '';
  return dayjs(value).locale(locale).format(fmt);
}

function formatDateTime(value, locale = 'pl') {
  return formatDate(value, 'D MMM YYYY, HH:mm', locale);
}

module.exports = { dayjs, DAY_KEYS, isPromoLive, formatDate, formatDateTime };
