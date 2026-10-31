require('dotenv').config();
const { createHash, randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
const DocumentModel = require('../dist/models/Document').default;
const QuizModel = require('../dist/models/Quiz').default;
const StudyTask = require('../dist/models/StudyTask').default;
const storage = require('../dist/services/storageService');

const apiBase = process.env.SMOKE_TEST_API_URL || `http://127.0.0.1:${process.env.PORT || 5000}/api`;
const initialPassword = 'AcademicSmoke42';
let userId;
let token;
let documentId;
let taskId;

const request = async (route, options = {}) => {
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${apiBase}${route}`, { ...options, headers });
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : await response.text();
  return { response, body };
};

const expectSuccess = ({ response, body }, status, label) => {
  assert.equal(response.status, status, `${label}: expected ${status}, received ${response.status}`);
  if (body && typeof body === 'object' && 'success' in body) {
    assert.equal(body.success, true, `${label}: ${body.message}`);
    return body.data;
  }
  return body;
};

const makeTestPdf = () => {
  const content = 'BT /F1 14 Tf 50 700 Td (CampusAI document storage smoke test) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const health = await request('/health');
  expectSuccess(health, 200, 'Health endpoint');

  if (process.env.NODE_ENV !== 'production') {
    for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
      const preflight = await fetch(`${apiBase}/auth/register`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      assert.equal(preflight.status, 204, `CORS preflight allows ${origin}`);
      assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
    }

    const rejectedOrigin = await fetch(`${apiBase}/auth/register`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://untrusted.example',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    assert.equal(rejectedOrigin.status, 500, 'CORS rejects unrelated origins');
    assert.equal(rejectedOrigin.headers.get('access-control-allow-origin'), null);
    console.log('PASS browser CORS preflights for local origins and rejection of unrelated origins');
  }

  const email = `smoke-${Date.now()}-${Math.random().toString(36).slice(2)}@example.invalid`;
  const registered = expectSuccess(
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'CampusAI Smoke Test', email, password: initialPassword, confirmPassword: initialPassword }),
    }),
    201,
    'Registration'
  );
  userId = registered.user._id;
  token = registered.token;
  assert.ok(token, 'Registration returns an authentication token');
  console.log('PASS registration and authentication');

  const profile = expectSuccess(
    await request('/auth/me', { method: 'PATCH', body: JSON.stringify({ name: 'Smoke Test Updated' }) }),
    200,
    'Profile update'
  );
  assert.equal(profile.user.name, 'Smoke Test Updated');
  const currentUser = expectSuccess(await request('/auth/me'), 200, 'Current-user endpoint');
  assert.equal(currentUser.user.name, 'Smoke Test Updated');
  console.log('PASS profile update and session');

  const dueDate = '2099-01-15T12:00:00.000Z';
  const createdTask = expectSuccess(
    await request('/planner', {
      method: 'POST',
      body: JSON.stringify({ title: 'Review process scheduling', subject: 'Operating systems', dueDate, durationMinutes: 45, priority: 'high' }),
    }),
    201,
    'Create study session'
  );
  taskId = createdTask.task._id;
  expectSuccess(
    await request(`/planner/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: true, owner: new mongoose.Types.ObjectId().toString() }),
    }),
    200,
    'Complete study session'
  );
  const persistedTask = await StudyTask.findById(taskId).lean();
  assert.equal(persistedTask.owner.toString(), userId, 'A task update must not allow transferring its owner');
  assert.equal(persistedTask.completed, true);
  const listedTasks = expectSuccess(await request('/planner'), 200, 'List study sessions');
  assert.equal(listedTasks.tasks.length, 1);
  const analytics = expectSuccess(await request('/analytics'), 200, 'Study analytics');
  assert.equal(analytics.completedTasks, 1);
  assert.equal(analytics.trackedStudyMinutes, 45);
  assert.equal(analytics.documents, 0);
  assert.equal(analytics.upcomingTasks, 0);
  console.log('PASS planner CRUD, ownership enforcement and real analytics');

  const quizList = expectSuccess(await request('/quizzes'), 200, 'List quizzes');
  assert.deepEqual(quizList.quizzes, []);
  const configuredAiKey = Boolean(
    process.env.OPENAI_API_KEY?.trim() &&
      !/^(?:sk-(?:placeholder|replace|your)|replace_with|your[_ -]?)/i.test(process.env.OPENAI_API_KEY.trim())
  );
  if (!configuredAiKey) {
    const quizWithoutAi = await request('/quizzes', {
      method: 'POST',
      body: JSON.stringify({ topic: 'Operating systems', questionCount: 3 }),
    });
    assert.equal(quizWithoutAi.response.status, 503, 'AI-dependent quiz generation clearly reports missing AI configuration');
  }
  console.log('PASS authenticated quiz library');

  const form = new FormData();
  form.append('file', new Blob([makeTestPdf()], { type: 'application/pdf' }), 'campus-ai-smoke-test.pdf');
  const uploaded = expectSuccess(await request('/documents', { method: 'POST', body: form }), 201, 'PDF upload');
  documentId = uploaded.document._id;
  const savedDocument = await DocumentModel.findById(documentId).lean();
  assert.equal(savedDocument.owner.toString(), userId);
  assert.equal(savedDocument.status, 'ready');
  assert.equal(await storage.fileExists(savedDocument.storageKey), true);

  const fileResponse = await request(`/documents/${documentId}/file`);
  assert.equal(fileResponse.response.status, 200, 'PDF download returns HTTP 200');
  assert.ok(fileResponse.body.startsWith('%PDF-1.4'), 'Downloaded PDF bytes match the source PDF');

  const unauthenticatedFile = await fetch(`${apiBase}/documents/${documentId}/file`);
  assert.equal(unauthenticatedFile.status, 401, 'PDFs are not available without authentication');
  expectSuccess(await request(`/documents/${documentId}`, { method: 'DELETE' }), 200, 'Delete PDF');
  assert.equal(await storage.fileExists(savedDocument.storageKey), false, 'Deleting a document also deletes its GridFS file');
  documentId = undefined;
  console.log('PASS private PDF upload, persistent GridFS download and cleanup');

  expectSuccess(
    await request('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword: initialPassword, newPassword: 'ChangedPassword57' }),
    }),
    200,
    'Change password'
  );
  const newPasswordLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'ChangedPassword57' }),
  });
  assert.equal(newPasswordLogin.response.status, 200, 'The changed password can log in');
  const oldPasswordLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: initialPassword }),
  });
  assert.equal(oldPasswordLogin.response.status, 401, 'The old password no longer works');

  const resetToken = randomBytes(32).toString('hex');
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        passwordResetTokenHash: createHash('sha256').update(resetToken).digest('hex'),
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    }
  );
  expectSuccess(
    await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: 'ResetPassword68' }),
    }),
    200,
    'Reset password'
  );
  const resetPasswordLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'ResetPassword68' }),
  });
  assert.equal(resetPasswordLogin.response.status, 200, 'The reset password can log in');
  const reusedResetToken = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: resetToken, password: 'AnotherPassword79' }),
  });
  assert.equal(reusedResetToken.response.status, 400, 'A reset link can only be used once');
  console.log('PASS password change, one-time password reset and login');

  const unauthenticatedPlanner = await fetch(`${apiBase}/planner`);
  assert.equal(unauthenticatedPlanner.status, 401, 'Planner data requires authentication');
  const unknownApi = await request('/endpoint-that-does-not-exist');
  assert.equal(unknownApi.response.status, 404, 'Unknown API endpoints return 404');
  assert.equal(unknownApi.body.success, false);
  console.log('PASS protected API routes and JSON 404 responses');
};

run()
  .catch((error) => {
    console.error('SMOKE TEST FAILED:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (userId) {
      if (documentId) {
        const document = await DocumentModel.findById(documentId);
        if (document) await storage.deleteFile(document.storageKey);
      }
      await Promise.all([
        DocumentModel.deleteMany({ owner: userId }),
        QuizModel.deleteMany({ owner: userId }),
        StudyTask.deleteMany({ owner: userId }),
        User.deleteOne({ _id: userId }),
      ]);
    }
    await mongoose.disconnect();
  });
