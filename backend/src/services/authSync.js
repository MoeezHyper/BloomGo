// Keeps app profiles and Firebase Auth accounts in step on startup:
// links profiles to their Firebase uid, creates the seeded demo accounts,
// moves pre-Firebase accounts across and mirrors suspensions.
const crypto = require('crypto');
const db = require('../db');
const { auth } = require('../firebase');
const { DEMO_PASSWORDS } = require('../data/seedUsers');

const notFound = (e) => e?.code === 'auth/user-not-found';

async function findAccount(user) {
  if (user.uid) {
    try {
      return await auth.getUser(user.uid);
    } catch (e) {
      if (!notFound(e)) throw e;
    }
  }
  try {
    return await auth.getUserByEmail(user.email);
  } catch (e) {
    if (!notFound(e)) throw e;
    return null;
  }
}

async function createAccount(user) {
  const disabled = user.status === 'suspended';
  const password = DEMO_PASSWORDS[user.email];
  if (password) {
    return auth.createUser({ email: user.email, password, displayName: user.name, emailVerified: true, disabled });
  }
  if (user.passwordHash) {
    // Account from before Firebase: its password can't be carried over, so it gets a random
    // one and the owner sets a new password with "Forgot password".
    const account = await auth.createUser({ email: user.email, password: crypto.randomBytes(18).toString('base64url'), displayName: user.name, disabled });
    console.log(`[firebase] ${user.email} moved to Firebase — they need to use "Forgot password" once.`);
    return account;
  }
  return null;
}

async function syncAuthUsers() {
  const summary = { linked: 0, created: 0, missing: [] };
  let changed = false;
  for (const user of db.data.users) {
    let account = await findAccount(user);
    if (!account) {
      account = await createAccount(user);
      if (!account) {
        summary.missing.push(user.email);
        continue;
      }
      summary.created += 1;
    }
    if (user.uid !== account.uid) {
      user.uid = account.uid;
      summary.linked += 1;
      changed = true;
    }
    if (user.passwordHash) {
      delete user.passwordHash;
      changed = true;
    }
    const disabled = user.status === 'suspended';
    if (account.disabled !== disabled) await auth.updateUser(account.uid, { disabled });
  }
  if (changed) db.save();
  return summary;
}

module.exports = { syncAuthUsers };
