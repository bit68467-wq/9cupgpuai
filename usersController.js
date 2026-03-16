const { nanoid, getCollection, write, generate6UniqueUserUid } = require('../db');

async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'missing fields' });

    const users = getCollection('user_v1');
    if (users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase())) {
      return res.status(409).json({ error: 'email exists' });
    }

    const now = new Date().toISOString();
    const user = {
      id: nanoid(),
      username,
      email: String(email).toLowerCase(),
      password,
      user_uid: generate6UniqueUserUid(),
      created_at: now,
      updated_at: now
    };
    users.push(user);
    await write();
    return res.status(201).json({ id: user.id, username: user.username, email: user.email, user_uid: user.user_uid });
  } catch (e) {
    console.error('register error', e);
    return res.status(500).json({ error: 'internal' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'missing fields' });

    const users = getCollection('user_v1');
    const user = users.find(u => u.email === String(email).toLowerCase() && u.password === password);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    // create or update session
    const sessions = getCollection('session_v1');
    const now = new Date().toISOString();
    const token = nanoid();
    let session = sessions.find(s => String(s.uid) === String(user.user_uid) || String(s.user_id) === String(user.id));
    if (session) {
      Object.assign(session, { user_id: user.id, uid: user.user_uid, username: user.username, email: user.email, updated_at: now, token });
    } else {
      session = { id: nanoid(), user_id: user.id, uid: user.user_uid, username: user.username, email: user.email, token, created_at: now, updated_at: now };
      sessions.push(session);
    }
    await write();

    // set cookie when possible
    try { res.cookie && res.cookie('cup9gpu_token', token, { httpOnly: true, sameSite: 'lax' }); } catch(e){}

    return res.json({ token, session_id: session.id, uid: session.uid, username: session.username, email: session.email, user_id: session.user_id });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'internal' });
  }
}

async function findByUid(req, res) {
  try {
    const uid = req.params.uid;
    const users = getCollection('user_v1');
    const found = users.find(u => String(u.user_uid) === String(uid) || String(u.id) === String(uid));
    if (!found) return res.status(404).json({ error: 'not found' });
    return res.json(found);
  } catch (e) {
    console.error('findByUid error', e);
    return res.status(500).json({ error: 'internal' });
  }
}

module.exports = {
  register,
  login,
  findByUid
};