import { test, expect } from "../../fixtures/api";
import { config } from "../../config";
import { getNotifications } from "../../helpers/api/notifications";
import { getTransactions } from "../../helpers/api/transactions";
import { getLikes } from "../../helpers/api/likes";
import { getComments } from "../../helpers/api/comments";
import { NotificationType } from "models";

const apiNotifications = `${config.BACKEND_URL}/notifications`;

test.describe("Notifications API", () => {
  test("GET /notifications gets a list of notifications for a user", async ({ request }) => {
    const res = await request.get(`${apiNotifications}`);
    expect(res.status()).toBe(200);
    const { results: notifications } = await res.json() as { results: Notification[] };
    expect(notifications.length).toBeGreaterThan(0);
  });

  test("POST /notifications creates notifications for transaction, like and comment", async ({ request }) => {
    const transactions = await getTransactions(request);
    const transaction = transactions[0];
    const likes = await getLikes(request);
    const like = likes[0];
    const comments = await getComments(request);
    const comment = comments[0];

    const res = await request.post(`${apiNotifications}/bulk`, {
      data: {
        items: [
          {
            type: "payment",
            transactionId: transaction.id,
            status: "received",
          },
          {
            type: "like",
            transactionId: transaction.id,
            likeId: like.id,
          },
          {
            type: "comment",
            transactionId: transaction.id,
            commentId: comment.id,
          },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const { results: notifications } = await res.json() as { results: NotificationType[] };
    expect(notifications.length).toBe(3);
    expect(notifications[0].transactionId).toBe(transaction.id);
    expect(notifications[1].transactionId).toBe(transaction.id);
    expect(notifications[2].transactionId).toBe(transaction.id);
  });

  test("PATCH /notifications/:notificationId updates a notification", async ({ request }) => {
    const notifications = await getNotifications(request);
    const notification = notifications[0];
    const res = await request.patch(`${apiNotifications}/${notification.id}`, {
      data: {
        isRead: true,
      },
    });
    expect(res.status()).toBe(204);
  });

  test("PATCH /notifications/:notificationId errors when invalid field sent", async ({ request }) => {
    const notifications = await getNotifications(request);
    const notification = notifications[0];
    
    const res = await request.patch(`${apiNotifications}/${notification.id}`, {
      data: {
        notANotificationField: "not a notification field",
      },
    });
    expect(res.status()).toBe(422);
    const { errors } = await res.json() as { errors: any[] };
    expect(errors.length).toBe(1);
  });
});