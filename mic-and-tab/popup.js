showLatestTranscript();

let mediaRecorder;

document.getElementById("start").addEventListener("click", async () => {
  // Start capture from mic
  const tab = await getCurrentTab();

  if (!tab) return alert("Require an active tab");
  chrome.scripting.executeScript({
    target: {
      tabId: tab.id,
    },
    files: ["content-script.js"],
  });

  // Start capture from tab
  startTabCapture();
});

document.getElementById("stop").addEventListener("click", async () => {
  // Stop capture from mic
  const tab = await getCurrentTab();

  if (!tab) return alert("Require an active tab");
  chrome.tabs.sendMessage(tab.id, { message: "stop" });

  // Stop capture from tab
  mediaRecorder.stop();
});

function startTabCapture() {
  chrome.tabCapture.capture({ audio: true }, async (stream) => {
    const liveStream = stream;

    // Continue to play the captured audio to the user.
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(audioCtx.destination);

    console.log("Starting recording....");

    mediaRecorder = new MediaRecorder(liveStream);
    mediaRecorder.start();

    let chunks = [];

    mediaRecorder.addEventListener("dataavailable", (event) => {
      console.log("event: ", event);
      chunks.push(event.data);

      console.log("CHUNKS: ", chunks);
    });

    mediaRecorder.addEventListener("stop", async () => {
      console.log("Stopping recording....");

      const audioBlob = new Blob(chunks, {
        type: "audio/webm",
      });

      const file = audioBlob;

      const storedToken = "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";

      const headers = new Headers({
        Authorization: `Bearer ${storedToken}`,
      });
      const formData = new FormData();
      formData.append("file", file, "recording.webm");
      formData.append("model", "whisper-1");
      // formData.append('prompt', storedPrompt.content);

      const requestOptions = {
        method: "POST",
        headers,
        body: formData,
        redirect: "follow",
      };

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        requestOptions
      );
      if (response.status === 200) {
        const result = await response.json();
        const resultText = result.text;

        console.log("Text successfully saved: ", resultText);

        stream.getTracks().forEach((track) => track.stop());
      } else {
        stream.getTracks().forEach((track) => track.stop());
      }
    });
  });
}

document.getElementById("clear").addEventListener("click", async () => {
  chrome.storage.local.remove(["transcript"]);
  document.getElementById("transcript").innerHTML = "";
});

document.getElementById("options").addEventListener("click", async () => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener(({ message }) => {
  if (message == "transcriptavailable") {
    showLatestTranscript();
  }
});

function showLatestTranscript() {
  chrome.storage.local.get("transcript", ({ transcript }) => {
    document.getElementById("transcript").innerHTML = transcript;
  });
}

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
