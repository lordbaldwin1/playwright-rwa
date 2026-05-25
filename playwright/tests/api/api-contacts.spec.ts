import { config } from "../../config";
import { test, expect } from "../../fixtures/api";
import { Contact } from "models";

const apiContacts = `${config.BACKEND_URL}/contacts`;

test.describe("Contacts API", () => {
  test("GET /contacts/:username gets a list of contacts by username", async ({
    authenticatedRequest,
    testUser,
  }) => {
    const { username } = testUser;
    const res = await authenticatedRequest.get(`${apiContacts}/${username}`);
    const { contacts } = (await res.json()) as { contacts: Contact[] };
    expect(res.status()).toBe(200);
    expect(Array.isArray(contacts)).toBe(true);
    expect(contacts[0]).toHaveProperty("userId");
    expect(contacts[0]).toHaveProperty("contactUserId");
    expect(contacts[0]).toHaveProperty("createdAt");
    expect(contacts[0]).toHaveProperty("modifiedAt");
    expect(contacts[0].userId).toBe(testUser.id);
  });

  test("POST /contacts creates a new contact", async ({
    authenticatedRequest,
    testUser,
    testContact,
  }) => {
    const { id: userId } = testUser;
    const res = await authenticatedRequest.post(`${apiContacts}`, {
      data: {
        contactUserId: testContact.id,
      },
    });
    expect(res.status()).toBe(200);
    const { contact } = (await res.json()) as { contact: Contact };
    expect(contact).toHaveProperty("userId");
    expect(contact).toHaveProperty("contactUserId");
    expect(contact).toHaveProperty("createdAt");
    expect(contact).toHaveProperty("modifiedAt");
    expect(contact.userId).toBe(userId);
  });

  test("POST /contacts errors when invalid contactUserId", async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post(`${apiContacts}`, {
      failOnStatusCode: false,
      data: {
        contactUserId: "1234",
      },
    });
    expect(res.status()).toBe(422);
    const { errors } = (await res.json()) as { errors: any[] };
    expect(Array.isArray(errors)).toBe(true);
    expect(errors).toHaveLength(1);
  });

  test("DELETE /contacts/:contactId deletes a contact", async ({
    authenticatedRequest,
    testContact,
  }) => {
    const { id: contactId } = testContact;
    const res = await authenticatedRequest.delete(`${apiContacts}/${contactId}`);
    expect(res.status()).toBe(200);
  });
});
