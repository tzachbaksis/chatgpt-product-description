import ExpiryMap from "expiry-map";
import { v4 as uuidv4 } from "uuid";
import { fetchSSE } from "./fetch-sse";

const KEY_ACCESS_TOKEN = "accessToken";

let prompt = "Rewrite this for brevity, in outline form:";
chrome.storage.sync.get("prompt", function (items) {
  if (items && items.prompt) {
    prompt = items.prompt;
  }
});

const cache = new ExpiryMap(10 * 1000);

async function getAccessToken() {
  if (cache.get(KEY_ACCESS_TOKEN)) {
    return cache.get(KEY_ACCESS_TOKEN);
  }
  const resp = await fetch("https://chat.openai.com/api/auth/session")
    .then((r) => r.json())
    .catch(() => ({}));
  if (!resp.accessToken) {
    console.log("no access token");
    throw new Error("UNAUTHORIZED");
  }
  cache.set(KEY_ACCESS_TOKEN, resp.accessToken);
  return resp.accessToken;
}

async function getSummary(question: string, callback: (msg: string) => any) {
  const accessToken = await getAccessToken();
  console.log("accessToken", accessToken);
  await fetchSSE("https://chat.openai.com/backend-api/conversation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: "next",
      messages: [
        {
          id: uuidv4(),
          role: "user",
          content: {
            content_type: "text",
            parts: [question],
          },
        },
      ],
      model: "text-davinci-002-render",
      parent_message_id: uuidv4(),
    }),
    onMessage(message: string) {
      console.debug("sse message", message);
      if (message === "[DONE]") {
        return;
      }
      const data = JSON.parse(message);
      const text = data.message?.content?.parts?.[0];
      if (text) {
        
        callback(text);
      }
    },
  });
}

// Listen for messages
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (message: any, port: any) => {
    console.log("message", message);
    if (message.title && message.description) {
      const title = message.title;
      const description = message.description;
      console.log("title", title);
      console.log("description", description);
      try {
        const question = `Act like an expert in the sales and marketing industry and create a captivating and persuasive eCommerce product description for "${title}".\n\nThe product current description is: "${description}". \n\nWrite the revised product description, without adding more text, and it should be no longer than ${description.length * 2} chars."`;
        console.log("question", question);
        await getSummary(question, (answer: any) => {
          console.log("answer", answer);
          chrome.runtime.sendMessage({ answer });
        });
      } catch (err: any) {
        console.error(err);
        chrome.runtime.sendMessage({ error: err.message });
        cache.delete(KEY_ACCESS_TOKEN);
      }
    }
  });
});
