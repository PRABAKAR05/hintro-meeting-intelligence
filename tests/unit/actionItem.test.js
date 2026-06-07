const request = require('supertest');
const app = require('../../src/app');

// Use the shared test setup
require('../setup');

describe('Action Item Endpoints', () => {
  let authToken;

  const testUser = {
    name: 'Action Tester',
    email: 'action@test.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    authToken = res.body.data.token;
  });

  describe('POST /api/action-items', () => {
    it('should create an action item', async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task: 'Prepare release notes',
          assignee: 'Alice',
          dueDate: '2026-05-25T00:00:00Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task).toBe('Prepare release notes');
      expect(res.body.data.assignee).toBe('Alice');
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should reject missing task', async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assignee: 'Alice' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing assignee', async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task: 'Do something' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task: 'Do it', assignee: 'Bob', status: 'INVALID' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/action-items/:id/status', () => {
    let actionItemId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task: 'Test task', assignee: 'Bob' });
      actionItemId = res.body.data._id;
    });

    it('should update status to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/action-items/${actionItemId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('should update status to COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/action-items/${actionItemId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch(`/api/action-items/${actionItemId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent item', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .patch(`/api/action-items/${fakeId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/action-items', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task: 'Task A', assignee: 'Alice', status: 'PENDING' });
      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task: 'Task B', assignee: 'Bob', status: 'IN_PROGRESS' });
    });

    it('should list all action items', async () => {
      const res = await request(app)
        .get('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.actionItems).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/action-items?status=PENDING')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data.actionItems).toHaveLength(1);
      expect(res.body.data.actionItems[0].status).toBe('PENDING');
    });

    it('should filter by assignee', async () => {
      const res = await request(app)
        .get('/api/action-items?assignee=Alice')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data.actionItems).toHaveLength(1);
      expect(res.body.data.actionItems[0].assignee).toBe('Alice');
    });
  });

  describe('GET /api/action-items/overdue', () => {
    it('should return overdue items', async () => {
      // Create a past-due item
      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task: 'Overdue task',
          assignee: 'Charlie',
          dueDate: '2020-01-01T00:00:00Z',
        });

      // Create a future item
      await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task: 'Future task',
          assignee: 'Dave',
          dueDate: '2030-12-31T00:00:00Z',
        });

      const res = await request(app)
        .get('/api/action-items/overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.overdueItems).toHaveLength(1);
      expect(res.body.data.overdueItems[0].task).toBe('Overdue task');
      expect(res.body.data.count).toBe(1);
    });

    it('should not include completed items in overdue', async () => {
      const createRes = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task: 'Completed old task',
          assignee: 'Eve',
          dueDate: '2020-01-01T00:00:00Z',
        });

      // Mark as completed
      await request(app)
        .patch(`/api/action-items/${createRes.body.data._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' });

      const res = await request(app)
        .get('/api/action-items/overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data.overdueItems).toHaveLength(0);
    });
  });
});

describe('Misc Endpoints', () => {
  describe('GET /health', () => {
    it('should return UP status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
    });
  });

  describe('GET /api/evaluation', () => {
    it('should return candidate info', async () => {
      const res = await request(app).get('/api/evaluation');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.candidateName).toBe('Prabakar');
      expect(res.body.data.email).toBe('ppraba0705@gmail.com');
      expect(res.body.data.externalIntegration).toBe('Telegram Bot API');
      expect(res.body.data.features).toBeInstanceOf(Array);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
