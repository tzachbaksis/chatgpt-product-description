chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  // const title = document.querySelector("input") as any; Shopify
  const title = document.querySelector("#title") as any;
  const description = document.querySelector("textarea") as any;
  if (title) {
    console.log("title:", title.value);
  } else {
    console.log("title is null");
  }
  if (description) {
    console.log("description:", description.value);
    console.log("description:", cleanHTML(description.value));
  } else {
    console.log("description is null");
  }
  console.log('sending response');

  if (title.value && description.value) {
    sendResponse({
      productTitle: title.value,
      productDescription: cleanHTML(description.value),
    });
  } else {
    sendResponse({
      error: "UNAUTHORIZED",
    });
  }
  return true;

  // if (msg.color) {
  //   console.log("Receive color = " + msg.color);
  //   document.body.style.backgroundColor = msg.color;
  //   sendResponse("Change color to " + msg.color);
  // } else {
  //   sendResponse("Color message is none.");
  // }
});

function cleanHTML(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}


// window.onload = () => {
//   setTimeout(() => {
//     const port = chrome.runtime.connect();
//     port.onMessage.addListener((msg) => {
//       console.log("msg received:", msg);
//       if (msg.error === "UNAUTHORIZED") {
//         console.log('please login at https://chat.openai.com');
//       }
//     });
    // port.postMessage({
    //   title: title.value,
    //   description: description.value,
    // });
  // }, 3000);
// };
