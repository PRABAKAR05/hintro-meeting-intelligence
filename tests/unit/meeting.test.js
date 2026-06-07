const request = require('supertest');
const app = require('../../src/app');

// Use the shared test setup
require('../setup');

describe('Meeting Endpoints', () => {
  let authToken;

  const testUser = {
    name: 'Meeting Tester',
    email: 'meeting@test.com',
    password: 'password123',
  };

  const testMeeting = {
    title: 'Sprint Planning',
    participants: ['alice@example.com', 'bob@example.com'],
    meetingDate: '2026-05-20T10:00:00Z',
    transcript: [
      { timestamp: '00:10', speaker: 'John', text: 'We should launch next Friday.' },
      { timestamp: '00:20', speaker: 'Alice', text: 'I will prepare release notes.' },
      { timestamp: '00:30', speaker: 'Bob', text: 'Let me handle the deployment.' },
    ],
  };

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    authToken = res.body.data.token;
  });

  describe('POST /api/meetings', () => {
    it('should create a meeting with valid data', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMeeting);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(testMeeting.title);
      expect(res.body.data.transcript).toHaveLength(3);
      expect(res.body.data.participants).toEqual(testMeeting.participants);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .send(testMeeting);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing title', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testMeeting, title: '' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject empty transcript', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testMeeting, transcript: [] });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid participant emails', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testMeeting, participants: ['not-an-email'] });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid meeting date', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testMeeting, meetingDate: 'not-a-date' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/meetings', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMeeting);
      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testMeeting, title: 'Standup' });
    });

    it('should list meetings with pagination', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meetings).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should support page and limit', async () => {
      const res = await request(app)
        .get('/api/meetings?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data.meetings).toHaveLength(1);
      expect(res.body.data.pagination.totalPages).toBe(2);
    });

    it('should filter by title', async () => {
      const res = await request(app)
        .get('/api/meetings?title=Sprint')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data.meetings).toHaveLength(1);
      expect(res.body.data.meetings[0].title).toBe('Sprint Planning');
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should get a meeting by ID', async () => {
      const createRes = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMeeting);

      const meetingId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(testMeeting.title);
      expect(res.body.data.transcript).toHaveLength(3);
    });

    it('should return 404 for non-existent meeting', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/meetings/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
