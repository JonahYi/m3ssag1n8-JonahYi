import { viewPostHierarhcy } from "./types";

/**
 * Web component for each individual post
 */
export class PostItem extends HTMLElement {
  private _data: viewPostHierarhcy | null = null;
  // private _parent: viewPostHierarhcy | null = null;
  private _username: string | null = null;
  private _postContainer: HTMLElement | null = null;
  private _textBox: HTMLFormElement | null = null;

  constructor() {
    super();
    // // console.log(""constructing");
    this.attachShadow({ mode: "open" });
  }

  /**
   * Set the username of the user viewing this post
   * @param username Username of the viewer
   */
  setUsername(username: string | null = null): void {
    this._username = username;
  }

  /**
   * Set the data of post
   * @param data Data of post
   */
  set data(data: viewPostHierarhcy) {
    this._data = data;
  }

  /**
   * When connected, display
   */
  connectedCallback(): void {
    this.display();
  }

  /**
   * When disconnected, display
   */
  diconnectedCallback(): void {
    this.display();
  }

  /**
   * Displays the post, including its text, reactions, and other attributes
   */
  private display(): void {
    if (this.shadowRoot) {
      // Clear the existing content
      this.shadowRoot.innerHTML = "";

      // Create a style element
      const style = document.createElement("style");
      style.textContent = `
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html {
        font-size: 1vw; // Adjust this value based on your design
      }
    
      .post {
        font-size: 1em; // Now this is relative to the root font size
      }
    
    `;

      // Append the style element to the shadow root
      this.shadowRoot.appendChild(style);

      // Reaction counts
      // // console.log(""setting reactions");
      const reactions = {
        smile: 0,
        frown: 0,
        like: 0,
        celebrate: 0,
      };

      // Safely check and assign reaction counts
      if (this._data && this._data.doc && this._data.doc.reactions) {
        reactions.smile = this._data.doc.reactions.smile
          ? this._data.doc.reactions.smile.length
          : 0;
        reactions.frown = this._data.doc.reactions.frown
          ? this._data.doc.reactions.frown.length
          : 0;
        reactions.like = this._data.doc.reactions.like
          ? this._data.doc.reactions.like.length
          : 0;
        reactions.celebrate = this._data.doc.reactions.celebrate
          ? this._data.doc.reactions.celebrate.length
          : 0;
      }

      // // console.log("reactions);
      // Create a container for the post using article element
      const postContainer = document.createElement("article");
      this._postContainer = postContainer;
      postContainer.style.width = "70%";
      postContainer.style.overflowWrap = "break-word";
      postContainer.classList.add("post");
      let x = 5;
      x = x * (this._data?.indents || 0);
      let padding = x.toString() + "vh";

      postContainer.style.marginLeft = padding;

      const header = document.createElement("header");
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.justifyContent = "space-between";
      header.style.flexWrap = "wrap";
      header.style.fontSize = "1.3vh";
      // Username
      const username = document.createElement("strong");
      username.textContent = `${this._data?.meta.createdBy}`;
      header.appendChild(username);

      // Add a line break for better formatting
      header.appendChild(document.createElement("br"));

      /// DATE ///
      const dateDisp = document.createElement("time");

      if (this._data?.meta) {
        const timestampStr: string = this._data.meta.createdAt.toString();
        const timestampNum: number = parseInt(timestampStr, 10); // Base 10 for decimal

        const date: Date = new Date(timestampNum);
        const datestring = date.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        });

        // Convert timestamp to a readable format and set datetime attribute
        dateDisp.setAttribute("datetime", datestring);
        dateDisp.textContent = datestring;
        header.appendChild(dateDisp);
      }
      postContainer.appendChild(header);

      var stringRep = this._data?.doc.msg;

      let htmlString = stringRep || "";

      // Rewrite to display new lines
      let stringRepLines = htmlString.split("\n");
      // console.log("stringRepLines);
      htmlString = "";
      stringRepLines.forEach((stringRepLine: string) => {
        htmlString = htmlString.concat(stringRepLine);
        htmlString = htmlString.concat("<br/>");
      });

      // Convert ** to bold text
      let stringRepBolds = htmlString.split("**");
      let bolded = false;
      htmlString = "";
      stringRepBolds.forEach((stringRepBold: string) => {
        // Start editing here
        if (bolded) {
          htmlString = htmlString.concat("<strong>");
          htmlString = htmlString.concat(stringRepBold);
          htmlString = htmlString.concat("</strong>");
        } else {
          htmlString = htmlString.concat(stringRepBold);
        }
        bolded = !bolded;
      });

      // Convert * to italicized text
      let stringRepItals = htmlString.split("*");
      let ital = false;
      htmlString = "";
      stringRepItals.forEach((stringRepItal: string) => {
        if (ital) {
          htmlString = htmlString.concat("<em>");
          htmlString = htmlString.concat(stringRepItal);
          htmlString = htmlString.concat("</em>");
        } else {
          htmlString = htmlString.concat(stringRepItal);
        }
        ital = !ital;
      });

      // Convert ^^ to superscript
      let stringRepSuperscripts = htmlString.split("^^");
      let superscript = false;
      htmlString = "";
      stringRepSuperscripts.forEach((stringRepSuperscript: string) => {
        // Start editing here
        if (superscript) {
          htmlString = htmlString.concat("<sup>");
          htmlString = htmlString.concat(stringRepSuperscript);
          htmlString = htmlString.concat("</sup>");
        } else {
          htmlString = htmlString.concat(stringRepSuperscript);
        }
        superscript = !superscript;
      });

      // Convert __ to subscript
      let stringRepSubscripts = htmlString.split("__");
      let subscript = false;
      htmlString = "";
      stringRepSubscripts.forEach((stringRepSubscript: string) => {
        // Start editing here
        if (subscript) {
          htmlString = htmlString.concat("<sub>");
          htmlString = htmlString.concat(stringRepSubscript);
          htmlString = htmlString.concat("</sub>");
        } else {
          htmlString = htmlString.concat(stringRepSubscript);
        }
        subscript = !subscript;
      });

      //Convert ()[] to link
      while (htmlString.indexOf("[") != -1) {
        htmlString = htmlString
          .substring(0, htmlString.indexOf("["))
          .concat(
            '<a href="',
            htmlString.substring(
              htmlString.indexOf("(") + 1,
              htmlString.indexOf(")"),
            ),
            '">',
            htmlString.substring(
              htmlString.indexOf("[") + 1,
              htmlString.indexOf("]"),
            ),
            "</a>",
            htmlString.substring(htmlString.indexOf(")") + 1),
          );
      }

      // Change all specific reaction syntax with the actual reaction
      htmlString = htmlString.replaceAll(
        ":smile:",
        '<iconify-icon icon="emojione:smiling-face"></iconify-icon>',
      );
      htmlString = htmlString.replaceAll(
        ":frown:",
        '<iconify-icon icon="emojione:frowning-face"></iconify-icon>',
      );
      htmlString = htmlString.replaceAll(
        ":like:",
        '<iconify-icon icon="emojione:thumbs-up"></iconify-icon>',
      );
      htmlString = htmlString.replaceAll(
        ":celebrate:",
        '<iconify-icon icon="emojione:party-popper"></iconify-icon>',
      );

      // Display the message text based on our modifications
      const message = document.createElement("p");
      message.innerHTML = htmlString;
      postContainer.appendChild(message);

      // creating smile icon
      const smileIcon = document.createElement("iconify-icon");
      smileIcon.setAttribute("icon", "emojione:smiling-face");
      smileIcon.setAttribute("width", "1.25em");
      smileIcon.setAttribute("height", "1.25em");
      const smile = document.createElement("button");
      smile.append(smileIcon);

      // Descriptive text for the smile button
      smileIcon.setAttribute("aria-label", "React with a smile");

      // Creating a text node for the count and appending it to the button
      const countSmile = document.createTextNode(` ${reactions.smile}`);
      smile.appendChild(countSmile); // Add the count directly to the button

      smile.style.display = "flex";
      smile.style.alignItems = "center";
      smile.style.gap = "1vh";

      let smilePressed = this._data?.doc?.reactions?.smile?.includes(
        this._username || "",
      );
      // Update the user as now reacting or not reacting with a smile
      if (smilePressed) {
        smile.style.backgroundColor = "#90EE90";
      } else {
        smile.style.backgroundColor = "#f0f0f0";
      }
      smile?.addEventListener("click", () => {
        let operation: string;
        // // console.log(""Smile reaction clicked");
        //If the current user clicked, have visual indicator
        if (smilePressed) {
          // // console.log(""shoud removcve");
          smile.style.backgroundColor = "#f0f0f0";
          this._data?.doc?.reactions?.smile?.push(this._username || "");
          // reactions.smile = reactions.smile - 1; // This needs to be more nuanced in practice
          operation = "ArrayRemove";
        } else {
          // // console.log(""should add");
          smile.style.backgroundColor = "#90EE90";
          this._data?.doc?.reactions?.smile?.push(this._username || "");
          operation = "ArrayAdd";
          // reactions.smile = reactions.smile + 1; // This needs to be more nuanced in practice
        }
        smilePressed = !smilePressed;
        // co.textContent = ` ${reactions.smile}`;
        smile.setAttribute("aria-live", "polite");

        const patchEvent = new CustomEvent("patchEvent", {
          detail: {
            op: operation,
            reaction: "smile",
            user: this._username || " temp",
            path: this._data?.path,
          },
        });

        document.dispatchEvent(patchEvent);
      });

      //Create the frown icon
      const frownIcon = document.createElement("iconify-icon");
      frownIcon.setAttribute("icon", "emojione:frowning-face");
      frownIcon.setAttribute("width", "1.25em");
      frownIcon.setAttribute("height", "1.25em");
      const frown = document.createElement("button");
      frown.append(frownIcon);

      frownIcon.setAttribute("aria-label", "React with a frown");

      // Creating a text node for the count and appending it to the button
      const countFrown = document.createTextNode(` ${reactions.frown}`);
      frown.appendChild(countFrown); // Add the count directly to the button

      frown.style.display = "flex";
      frown.style.alignItems = "center";
      frown.style.gap = "1vh";

      let frownPressed = this._data?.doc?.reactions?.frown?.includes(
        this._username || "",
      );

      frown.setAttribute("aria-live", "polite");
      //Update the user as reacting or not reacting with a frown
      if (frownPressed) {
        frown.style.backgroundColor = "#90EE90";
      } else {
        frown.style.backgroundColor = "#f0f0f0";
      }
      frown?.addEventListener("click", () => {
        let operation: string;
        // // console.log(""Frown reaction clicked");
        //If the current user clicked, have visual indicator
        if (frownPressed) {
          // // console.log(""should remove");
          frown.style.backgroundColor = "#f0f0f0";
          operation = "ArrayRemove";
          this._data?.doc?.reactions?.frown?.push(this._username || "");
          // reactions.frown = reactions.frown - 1; // This needs to be more nuanced in practice
        } else {
          // // console.log(""should add");
          operation = "ArrayAdd";
          frown.style.backgroundColor = "#90EE90";
          this._data?.doc?.reactions?.frown?.push(this._username || "");
          // reactions.frown = reactions.frown + 1; // This needs to be more nuanced in practice
        }
        frownPressed = !frownPressed;
        const patchEvent = new CustomEvent("patchEvent", {
          detail: {
            op: operation,
            reaction: "frown",
            user: this._username,
            path: this._data?.path,
          },
        });

        document.dispatchEvent(patchEvent);
      });

      //Make like button
      const likeIcon = document.createElement("iconify-icon");
      likeIcon.setAttribute("icon", "emojione:thumbs-up");
      likeIcon.setAttribute("width", "1.25em");
      likeIcon.setAttribute("height", "1.25em");
      const like = document.createElement("button");
      like.append(likeIcon);

      likeIcon.setAttribute("aria-label", "React with a like");

      // Creating a text node for the count and appending it to the button
      const countLike = document.createTextNode(` ${reactions.like}`);
      like.appendChild(countLike); // Add the count directly to the button
      like.setAttribute("aria-live", "polite");

      like.style.display = "flex";
      like.style.alignItems = "center";
      like.style.gap = "1vh";

      let likePressed = this._data?.doc?.reactions?.like?.includes(
        this._username || "",
      );
      if (likePressed) {
        like.style.backgroundColor = "#90EE90";
      } else {
        like.style.backgroundColor = "#f0f0f0";
      }
      //Update like reactors when cliked
      like?.addEventListener("click", () => {
        // console.log(""Like reaction clicked");
        let operation: string;
        //If the current user clicked, have visual indicator
        if (likePressed) {
          operation = "ArrayRemove";
          like.style.backgroundColor = "#f0f0f0";

          this._data?.doc?.reactions?.like?.push(this._username || "");
          // reactions.like = reactions.like - 1; // This needs to be more nuanced in practice
        } else {
          operation = "ArrayAdd";
          like.style.backgroundColor = "#90EE90";
          this._data?.doc?.reactions?.like?.push(this._username || "");
          // reactions.like = reactions.like + 1; // This needs to be more nuanced in practice
        }
        likePressed = !likePressed;

        const patchEvent = new CustomEvent("patchEvent", {
          detail: {
            op: operation,
            reaction: "like",
            post: "idk",
            user: this._username || " temp",
            path: this._data?.path,
          },
        });

        document.dispatchEvent(patchEvent);
      });

      //Create celebrate button
      const celebrateIcon = document.createElement("iconify-icon");
      celebrateIcon.setAttribute("icon", "emojione:party-popper");
      celebrateIcon.setAttribute("width", "1.25em");
      celebrateIcon.setAttribute("height", "1.25em");
      const celebrate = document.createElement("button");
      celebrate.append(celebrateIcon);

      celebrateIcon.setAttribute("aria-label", "React with celebration");

      celebrate.setAttribute("aria-live", "polite");

      // Creating a text node for the count and appending it to the button
      const countCeleb = document.createTextNode(` ${reactions.celebrate}`);
      celebrate.appendChild(countCeleb); // Add the count directly to the button

      celebrate.style.display = "flex";
      celebrate.style.alignItems = "center";
      celebrate.style.gap = "1vh";

      let celebratePressed = this._data?.doc?.reactions?.celebrate?.includes(
        this._username || "",
      );
      //Update celebrating users when pressed
      if (celebratePressed) {
        celebrate.style.backgroundColor = "#90EE90";
      } else {
        celebrate.style.backgroundColor = "#f0f0f0";
      }
      celebrate?.addEventListener("click", () => {
        let operation: string;
        // console.log(""Celebrate reaction clicked");
        //If the current user clicked, have visual indicator
        if (celebratePressed) {
          operation = "ArrayRemove";
          celebrate.style.backgroundColor = "#f0f0f0";
          this._data?.doc?.reactions?.celebrate?.push(this._username || "");
          // reactions.celebrate = reactions.celebrate - 1; // This needs to be more nuanced in practice
        } else {
          operation = "ArrayAdd";
          celebrate.style.backgroundColor = "#90EE90";
          this._data?.doc?.reactions?.celebrate?.push(this._username || "");
          // reactions.celebrate = reactions.celebrate + 1; // This needs to be more nuanced in practice
        }
        celebratePressed = !celebratePressed;
        const patchEvent = new CustomEvent("patchEvent", {
          detail: {
            op: operation,
            reaction: "celebrate",
            user: this._username,
            path: this._data?.path,
          },
        });

        document.dispatchEvent(patchEvent);
      });
      // Put all reactions in a footer
      const reactionsContainer = document.createElement("footer");
      reactionsContainer.style.display = "flex";
      reactionsContainer.style.alignItems = "center";
      reactionsContainer.style.justifyContent = "space-around";
      reactionsContainer.style.marginTop = "1em";
      reactionsContainer.style.width = "fit-content";

      reactionsContainer.appendChild(smile);
      reactionsContainer.appendChild(celebrate);
      reactionsContainer.appendChild(frown);
      reactionsContainer.appendChild(like);

      postContainer.appendChild(reactionsContainer);

      // Create reply button
      const replyIcon = document.createElement("iconify-icon");
      replyIcon.setAttribute("icon", "material-symbols:reply");
      replyIcon.setAttribute("width", "1.25em");
      replyIcon.setAttribute("height", "1.25em");
      const reply = document.createElement("button");
      replyIcon.setAttribute("aria-label", "Reply to post");
      reply.append(replyIcon);

      //   Rrefresh Handler
      reply.addEventListener("click", () => {
        const replytoPost = new CustomEvent("replytoPost", {
          detail: { id: this._data?.path },
        });
        console.log("Clicked on replying to posts", replytoPost);

        document.dispatchEvent(replytoPost);
      });

      reactionsContainer.appendChild(reply);

      //Stylize the post
      postContainer.style.border = "1px solid #ccc";
      postContainer.style.borderRadius = "5px";
      postContainer.style.marginBottom = "1vh";
      postContainer.style.backgroundColor = "#fefefe";
      postContainer.style.padding = "1vh";
      postContainer.style.boxSizing = "border-box";
      // Append the post container to the shadow root
      this.shadowRoot.appendChild(postContainer);
    } else {
      console.error("Shadow DOM is not available.");
      throw new Error("shadowRoot does not exist");
    }
  }

  /**
   * Adds the text box and all of its functionality when replying
   * @param openChannelId The channel the post is in
   * @param parent The parent of the reply
   */
  addTextBox(openChannelId: string | null = null, parent: string): void {
    //Create textbox
    const textBox = document.createElement("form");
    this._postContainer?.appendChild(textBox);

    //Create text area to type words
    const message = document.createElement("textarea");
    message.focus();
    message.id = "new-message";
    message.name = "message";
    message.placeholder = "Type your message here...";
    message.setAttribute("aria-label", "Type your message here");
    textBox.append(message);
    let shiftPressed = false;

    //When pressing enter there is two possibiilties
    message?.addEventListener("keydown", (event) => {
      if (event.key == "Shift") {
        shiftPressed = true;
      }

      if (event.key == "Enter") {
        if (!shiftPressed) {
          const messageEvent = new CustomEvent("messageEvent", {
            detail: {
              name: openChannelId,
              message: message.value,
              parent: parent,
            },
          });
          document.dispatchEvent(messageEvent);
        } else {
          //If shift is pressed, jsut go to next line
          // console.log(""Enter shift");
        }
      }
    });

    message?.addEventListener("keyup", (event) => {
      if (event.key == "Shift") {
        shiftPressed = false;
      }
    });

    //Create send button
    const sendButton = document.createElement("button");
    sendButton.type = "button";
    sendButton.id = "send-button";
    sendButton.textContent = "Send";
    textBox.append(sendButton);

    //Send button sends message when cliked
    sendButton?.addEventListener("click", () => {
      const messageEvent = new CustomEvent("messageEvent", {
        detail: {
          name: openChannelId,
          message: message.value,
          parent: parent,
        },
      });

      document.dispatchEvent(messageEvent);
    });

    //Create smile button
    const smileButton = document.createElement("button");
    smileButton.type = "button";
    smileButton.id = "smile-button";
    const smileIcon = document.createElement("iconify-icon");
    smileIcon.setAttribute("icon", "emojione:smiling-face");
    smileIcon.setAttribute("width", "1.25em");
    smileIcon.setAttribute("height", "1.25em");
    smileButton.append(smileIcon);
    textBox.append(smileButton);

    smileButton.setAttribute("aria-label", "Add a smile reaction to post");

    //Creates text format for a smile in textarea
    smileButton?.addEventListener("click", () => {
      message.value = message.value.concat(":smile:");
    });

    //Create frown button
    const frownButton = document.createElement("button");
    frownButton.type = "button";
    frownButton.id = "frown-button";
    const frownIcon = document.createElement("iconify-icon");
    frownIcon.setAttribute("icon", "emojione:frowning-face");
    frownIcon.setAttribute("width", "1.25em");
    frownIcon.setAttribute("height", "1.25em");
    frownButton.append(frownIcon);
    textBox.append(frownButton);

    // Descriptive text for the smile button
    const frownDesc = document.createElement("p");
    frownDesc.id = "frown-desc";
    frownDesc.textContent = "Add a frown reaction to your post";
    frownDesc.style.display = "none"; // Hide the description from view but still accessible to screen readers
    frownButton.setAttribute("aria-describedby", "frown-desc");
    frownButton.setAttribute("aria-label", "React with a frown");

    //Creates frown format in textarea
    frownButton?.addEventListener("click", () => {
      // console.log(""Frown clicked");
      message.value = message.value.concat(":frown:");
    });

    //Create like button
    const likeButton = document.createElement("button");
    likeButton.type = "button";
    likeButton.id = "like-button";
    const likeIcon = document.createElement("iconify-icon");
    likeIcon.setAttribute("icon", "emojione:thumbs-up");
    likeIcon.setAttribute("width", "1.25em");
    likeIcon.setAttribute("height", "1.25em");
    likeButton.append(likeIcon);
    textBox.append(likeButton);

    const likeDesc = document.createElement("p");
    likeDesc.id = "like-desc";
    likeDesc.textContent = "Add a like in your post";
    likeDesc.style.display = "none"; // Hide the description from view but still accessible to screen readers
    likeButton.setAttribute("aria-describedby", "like-desc");
    likeButton.setAttribute("aria-label", "React with a like");

    //Create like format in textarea
    likeButton?.addEventListener("click", () => {
      // console.log(""Like clicked");
      message.value = message.value.concat(":like:");
    });

    //Create celebrate button
    const celebrateButton = document.createElement("button");
    celebrateButton.type = "button";
    celebrateButton.id = "celebrate-button";
    const celebrateIcon = document.createElement("iconify-icon");
    celebrateIcon.setAttribute("icon", "emojione:party-popper");
    celebrateIcon.setAttribute("width", "1.25em");
    celebrateIcon.setAttribute("height", "1.25em");
    celebrateButton.append(celebrateIcon);
    textBox.append(celebrateButton);

    const CelebrateDesc = document.createElement("p");
    CelebrateDesc.id = "celebrate-desc";
    CelebrateDesc.textContent = "Add a celebration emoji to your post";
    CelebrateDesc.style.display = "none"; // Hide the description from view but still accessible to screen readers
    celebrateButton.setAttribute("aria-describedby", "celebrate-desc");
    celebrateButton.setAttribute(
      "aria-label",
      "Add a celebration emoji to your post",
    );

    //Create celebrate format in textarea
    celebrateButton?.addEventListener("click", () => {
      // console.log(""Celebrate clicked");
      message.value = message.value.concat(":celebrate:");
    });

    //Create bold button
    const boldButton = document.createElement("button");
    boldButton.type = "button";
    boldButton.id = "bold-button";
    boldButton.textContent = "bold";
    textBox.append(boldButton);

    boldButton.setAttribute("aria-label", "set bold style to highlighted text");

    //Create bold format in textarea
    boldButton?.addEventListener("click", () => {
      message.value = message.value
        .substring(0, message.selectionStart)
        .concat(
          "**",
          message.value.substring(message.selectionStart, message.selectionEnd),
          "**",
          message.value.substring(message.selectionEnd),
        );
    });

    //Create italic button
    const italicButton = document.createElement("button");
    italicButton.type = "button";
    italicButton.id = "italic-button";
    italicButton.textContent = "italic";
    textBox.append(italicButton);

    const italicDesc = document.createElement("p");
    italicDesc.id = "italic-desc";
    italicDesc.textContent = "set italic style to highlighted text";
    italicDesc.style.display = "none"; // Hide the description from view but still accessible to screen readers
    italicButton.setAttribute("aria-describedby", "italic-desc");

    //Create italic format in textarea
    italicButton?.addEventListener("click", () => {
      // console.log(""Italic clicked");
      message.value = message.value
        .substring(0, message.selectionStart)
        .concat(
          "*",
          message.value.substring(message.selectionStart, message.selectionEnd),
          "*",
          message.value.substring(message.selectionEnd),
        );
    });

    //Create link button
    const linkButton = document.createElement("button");
    linkButton.type = "button";
    linkButton.id = "link-button";
    linkButton.textContent = "link";
    textBox.append(linkButton);

    const linkDesc = document.createElement("p");
    linkDesc.id = "link-desc";
    linkDesc.textContent = "set italic style to highlighted text";
    linkDesc.style.display = "none"; // Hide the description from view but still accessible to screen readers
    linkButton.setAttribute("aria-describedby", "link-desc");

    //Create link format in textarea
    linkButton?.addEventListener("click", () => {
      // console.log(""Link clicked");
      message.value = message.value
        .substring(0, message.selectionStart)
        .concat(
          "[",
          message.value.substring(message.selectionStart, message.selectionEnd),
          "]",
          "(",
          message.value.substring(message.selectionStart, message.selectionEnd),
          ")",
          message.value.substring(message.selectionEnd),
        );
    });
    this._textBox = textBox;

    //Create superscript button
    const superscriptButton = document.createElement("button");
    superscriptButton.type = "button";
    superscriptButton.id = "superscript-button";
    superscriptButton.textContent = "superscript";
    textBox.append(superscriptButton);

    const superDesc = document.createElement("p");
    superDesc.id = "super-desc";
    superDesc.textContent = "set italic style to highlighted text";
    superDesc.style.display = "none"; // Hide the description from view but still accessible to screen readers
    superscriptButton.setAttribute("aria-describedby", "super-desc");

    //Create superscript format in text area
    superscriptButton?.addEventListener("click", () => {
      // console.log(""Superscript clicked");
      message.value = message.value
        .substring(0, message.selectionStart)
        .concat(
          "^^",
          message.value.substring(message.selectionStart, message.selectionEnd),
          "^^",
          message.value.substring(message.selectionEnd),
        );
    });

    //Create subscript button
    const subscriptButton = document.createElement("button");
    subscriptButton.type = "button";
    subscriptButton.id = "subscript-button";
    subscriptButton.textContent = "subscript";
    textBox.append(subscriptButton);

    const subDesc = document.createElement("p");
    subDesc.id = "sub-desc";
    subDesc.textContent = "set italic style to highlighted text";
    subDesc.style.display = "none"; // Hide the description from view but still accessible to screen readers
    subscriptButton.setAttribute("aria-describedby", "sub-desc");

    //Create subscript button for textarea
    subscriptButton?.addEventListener("click", () => {
      // console.log(""Subscript clicked");
      message.value = message.value
        .substring(0, message.selectionStart)
        .concat(
          "__",
          message.value.substring(message.selectionStart, message.selectionEnd),
          "__",
          message.value.substring(message.selectionEnd),
        );
    });
  }

  //Remove the text box when it's not needed
  removeTextBox(): void {
    this._textBox?.remove();
  }
}
