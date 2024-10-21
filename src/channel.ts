import { ViewChannel } from "./types";

/**
 * Class ChannelItem is a custom webcomponent for displaying a Channel Item
 *
 * @extends HTMLElement
 */
export class ChannelItem extends HTMLElement {
  private _data: ViewChannel | null = null;

  private openClickHandler = () => {
    // console.log("channel open button clicked");
    const openEventChannel = new CustomEvent("openEventChannel", {
      detail: { name: this._data?.path },
    });
    document.dispatchEvent(openEventChannel);
    // console.log("activate state");
    this.ActiveState();
  };

  private deleteClickHandler = () => {
    // console.log("channel delete button clicked");
    const deleteChannel = new CustomEvent("deleteChannel", {
      detail: { id: this._data?.path },
    });
    document.dispatchEvent(deleteChannel);
  };
  channelButton: HTMLButtonElement;

  constructor() {
    super();
    // // console.log("constructing");
    this.attachShadow({ mode: "open" });
    this.channelButton = document.createElement("button");
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
    <style>
    button {
      padding: 1vh 1vh;
      margin-right: 1vh; 
      border: 1px solid #ccc;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    button:hover {
      background-color: #dcdcdc;
      cursor: pointer; /* Mouse cursor --> hand icon when hovering over the button */
    }
    .active {
      background-color: #6402E4;
      color: white; /* White text color */
  }
    </style>
`;
    }
  }

  set data(data: ViewChannel) {
    this._data = data;
  }

  connectedCallback(): void {
    this.display();
    document.addEventListener("channelDeleted", (event: CustomEvent) => {
      if (this._data?.path === event.detail.id) {
        this.remove(); // This removes the component from the DOM
      }
    });
  }

  diconnectedCallback(): void {
    // Remove event listeners
    const openButton = this.shadowRoot?.querySelector("button.open-button");
    const deleteButton = this.shadowRoot?.querySelector("button.delete-button");

    if (openButton) {
      openButton.removeEventListener("click", this.openClickHandler);
    }

    if (deleteButton) {
      deleteButton.removeEventListener("click", this.deleteClickHandler);
    }
  }

  /**
   * ActivateState switches the color of the channel item
   */
  ActiveState(): void {
    this.channelButton.classList.add("active");
  }
  /**
   * DeactivateState switches the color of the channel item
   *
   */
  DeactivateState(): void {
    this.channelButton.classList.remove("active");
  }

  /**
   * display displays sets up the visual of the channel item
   *
   */
  private display(): void {
    console.log(this._data);
    if (this.shadowRoot) {
      const path = JSON.stringify(this._data?.path, null, 2);
      const paths = path.split("/");
      const name = paths[paths.length - 1];

      // Create elements to display the Channels

      const item = document.createElement("p");
      item.style.listStyle = "none";

      const label = document.createElement("label");

      // Create open button
      const openIcon = document.createElement("iconify-icon");
      openIcon.setAttribute("icon", "bi:box-arrow-in-right");
      openIcon.setAttribute("width", "1.25em");
      openIcon.setAttribute("height", "1.25em");
      const open = document.createElement("button");
      open.append(openIcon);
      open.setAttribute("aria-label", "Open " + name); // ARIA label
      open.setAttribute("role", "button"); // ARIA role

      //  add an event to the open button that we want to open this workspace
      open.addEventListener("click", this.openClickHandler);

      //   Create delete button
      const trashIcon = document.createElement("iconify-icon");
      trashIcon.setAttribute("icon", "iconamoon:trash-fill");
      trashIcon.setAttribute("width", "1.25em");
      trashIcon.setAttribute("height", "1.25em");
      const trash = document.createElement("button");
      trash.append(trashIcon);
      trash.setAttribute("aria-label", "Delete " + name); // ARIA label
      trash.setAttribute("role", "button"); // ARIA role

      //   Delete handler
      trash.addEventListener("click", this.deleteClickHandler);

      label.append(name.replace(/^"\/|"$|^\//g, ""));
      // label.classList.add("todo");
      item.append(label, trash, open); //pencil

      // // console.log("addind data to shadowroot");
      this.channelButton.appendChild(item);
      this.shadowRoot.appendChild(this.channelButton);
    } else {
      throw new Error("shadowRoot does not exist");
    }
  }
}
