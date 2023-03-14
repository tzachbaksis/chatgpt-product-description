import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBasket, faClipboard } from "@fortawesome/free-solid-svg-icons";


const Popup = () => {
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [suggestion, setSuggestion] = useState<string>();
  const port = chrome.runtime.connect();

  function refreshProductDetails() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            color: "#555555"
          },
          (msg) => {
            console.log("response:", msg);
            if (msg?.productTitle) {
              setTitle(msg.productTitle);
            }
            if (msg?.productDescription) {
              setDescription(msg.productDescription);
            }
          }
        );
      }
    });
  }

  useEffect(() => {
    console.log("popup mounted");
    refreshProductDetails();
  }, [])

  useEffect(() => {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      console.log("msg received:", msg);
      if (msg.error === "UNAUTHORIZED") {
        console.log('please login at https://chat.openai.com');
      } else if (msg.answer) {
        setSuggestion(removeQuotes(msg.answer))
      } else {
        console.log('unknown message');
      }
    });
  }, [])

  useEffect(() => {
    console.log("title or description changed");
    port.postMessage({
      title: title,
      description: description,
    });
  }, [title, description])

  const tryAgain = () => {
    console.log("change background");
    refreshProductDetails()
    port.postMessage({
      title: title,
      description: description,
    });
  };

  const removeQuotes = (str: string) => {
    return str.replace(/"/g, "");
  }

  const handleCopy = () => {
    if (!suggestion) return
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "450px" }}>
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px" }}>
          <FontAwesomeIcon icon={faShoppingBasket} size="5x" />
          <h2 style={{ marginTop: "10px" }}>{title}</h2>
          <p style={{ marginTop: "10px", textAlign: "center" }}>{description}</p>
        </section>
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px" }}>
          <button onClick={tryAgain} style={{ marginTop: "10px" }}>
            Try Another Suggestion
          </button>
        </section>
        {suggestion && (
          <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px" }}>
            <p style={{ marginTop: "10px", textAlign: "center" }}>{suggestion}</p>
            <button onClick={handleCopy} style={{ marginTop: "10px" }}>
              <FontAwesomeIcon icon={faClipboard} />
              {copied ? " Copied!" : " Copy"}
            </button>
          </section>
        )}
      </div>

      {/*<div style={{minWidth: "450px"}}>*/}
      {/*  <h1>Floodlight ChatGPT Product Description</h1>*/}
      {/*  <h2>{title}</h2>*/}
      {/*  <p>{description}</p>*/}
      {/*  {suggestion && <p>Suggestion: {suggestion}</p>}*/}
      {/*  <button onClick={tryAgain}>try again</button>*/}
      {/*</div>*/}
      {/*<ul style={{ minWidth: "700px" }}>*/}
      {/*  <li>Current URL: {currentURL}</li>*/}
      {/*  <li>Current Time: {new Date().toLocaleTimeString()}</li>*/}
      {/*  <li>Title: {title}</li>*/}
      {/*  <li>Description: {description}</li>*/}
      {/*  */}
      {/*</ul>*/}
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
