import { fetchEventSource } from "../node_modules/@microsoft/fetch-event-source/lib/cjs/fetch";
import { jsonDoc, Doc } from "./types";
import { Validator } from "./validation";

/**
 * Declare names and types of environment variables.
 */
declare const process: {
  env: {
    DATABASE_HOST: string;
    DATABASE_PATH: string;
    AUTH_PATH: string;
  };
};

/**
 * Wrapper around fetch to return a Promise that resolves to the desired
 * type. This function does not validate whether the response actually
 * conforms to that type.
 *
 * @param url      url to fetch from
 * @param options  fetch options
 * @returns        a Promise that resolves to the unmarshaled JSON response
 * @throws         an error if the fetch fails, there is no response body,
 *                 or the response is not valid JSON
 */
function typedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  console.log("in fetch");
  console.log(url, options?.headers);
  return fetch(url, options).then((response: Response) => {
    if (!response.ok) {
      console.log("Response not ok:", response);
      throw new Error(response.status.toString());
    }

    console.log(response);
    return response.json() as Promise<T>;
  });
}

/**
 * Wrapper around fetch to return a Promise that resolves when an empty
 * response is received.
 *
 * @param url      url to fetch from
 * @param options  fetch options
 * @returns        a Promise that resolves when an empty response is received
 * @throws         an error if the fetch fails or there is a response body,
 */
function emptyFetch(url: string, options?: RequestInit): Promise<void> {
  return fetch(url, options).then((response: Response) => {
    // console.log("resposne in empty fetch:", response);
    if (!response.ok) {
      throw new Error(response.status.toString());
    }

    // Return decoded JSON if there is a response body or null otherwise
    const contentLength = response.headers.get("Content-Length");
    if (contentLength && contentLength !== "0") {
      // Should not be a response body
      throw new Error(`expected empty response`);
    } else {
      // No content
      return;
    }
  });
}

/**
 * Model class that interfaces with OwlDB
 */
export class Model {
  logout(): Promise<void> {
    const options = {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
        accept: "/*",
      },
    };

    // console.log("logging out:", this.token);

    console.log(
      options,
      `${process.env.DATABASE_HOST}/${process.env.AUTH_PATH}`,
    );

    return emptyFetch(
      `${process.env.DATABASE_HOST}/${process.env.AUTH_PATH}`,
      options,
    );
  }

  token: any;

  /**
   * Authenticates a user given a username.
   *
   * @returns a promise that resolves to nothing to indicate if logged in or not?
   */
  authenticate(user: string): Promise<void> {
    const postData = {
      username: user,
    };

    return fetch(`${process.env.DATABASE_HOST}/${process.env.AUTH_PATH}`, {
      method: "POST",
      body: JSON.stringify(postData),
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        this.token = data.token; // Store the token thats returned from authentification
        // console.log("Authentication successful:", data);
        localStorage.setItem("isAuthenticated", "true");
      })
      .catch((error) => {
        console.error("Authentication error:", error);
        throw new Error(error);
      });
  }

  /**
   * Update the reaction based on a user changing what they react to
   *
   * @param op The options
   * @param reaction The reaction changed
   * @param user The user who did the reaction
   * @param path The path to the post
   * @returns
   */
  updateReaction(op: string, reaction: string, user: string, path: string) {
    // console.log("in update reaction");
    console.log(user);
    // need to get selected post
    const options = {
      method: "PATCH",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        { op: op, path: `/reactions/${reaction}`, value: user },
      ]),
    };
    // console.log("Patching");
    console.log(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}`,
    );
    console.log(options);
    return typedFetch(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}`,
      options,
    );
  }

  /**
   * Patching a post if it doesnt contain the reactions array
   *
   */
  addReactions(path: string) {
    const options = {
      method: "PATCH",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          op: "ObjectAdd",
          path: "/reactions",
          value: {
            smile: [],
            frown: [],
            like: [],
            celebrate: [],
          },
        },
      ]),
    };
    console.log("Patching");
    console.log(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}`,
    );
    console.log(options);
    return typedFetch(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}`,
      options,
    );
  }

  //Create a start subscribe function that happens when channel is opened
  startSubscription(
    url: string,
    controller: AbortController,
    options?: RequestInit,
  ) {
    const subscriptionUrl = url + "/posts/?mode=subscribe";
    console.log("Subscribing to:", subscriptionUrl);
    fetchEventSource(subscriptionUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "text/event-stream",
      },
      async onopen(response) {
        if (
          response.ok &&
          response.headers.get("content-type") === "text/event-stream"
        ) {
          return; // everything's good
        } else {
          // client-side errors are usually non-retriable:
          throw new Error(response.statusText);
        }
      },
      onmessage(msg) {
        // console.log("subscribe got message:", msg);
        if (msg.event == "update") {
          let data: any = JSON.parse(msg.data);

          console.log(data);

          //Catch this in main
          const subscribeUpdateEvent = new CustomEvent("subscribeEvent", {
            detail: { data: data },
          });

          document.dispatchEvent(subscribeUpdateEvent);
        }
      },
      openWhenHidden: true,
      signal: controller.signal,
    });
  }

  /**
   * Get all Workspaces from database.
   *
   * @returns a promise that resolves to an array of Workspaces.
   */
  getWorkspaces(validator: Validator): Promise<Array<Doc>> {
    // console.log(" in getting workspaces");

    return typedFetch<Array<Doc>>(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}/`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      },
    )
      .then((data) => {
        console.log(data);
        // Assuming each item in the array needs to be validated
        data.forEach((wokrspaceItem) => {
          // console.log("validating workspace:", wokrspaceItem);

          if (!validator.validate(wokrspaceItem, "workspace")) {
            // console.error('Validation error:', validator.ajv.errors); // Log specifi
            throw new Error("Invalid workspace data");
          }
        });
        return data; // Return the validated data
      })
      .catch((error) => {
        console.error("Error during a single channel validation:", error);
        throw error; // Re-throw the error to be handled by the caller
      });
  }

  /**
   * Create a channel under a workspace
   * @param workspaceName Workspace channel is under
   * @param channelName The name of the channel
   * @returns
   */
  createChannel(workspaceName: string, channelName: string): Promise<string> {
    const options = {
      method: "PUT",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    };

    // console.log("putting channel:");

    console.log(
      options,
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${workspaceName}/channels/${channelName}`,
    );

    return typedFetch(
      // response is 201  {  "uri": "/v1/group18/workspace1/channels/chan1" }
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${workspaceName}/channels/${channelName}`,
      options,
    ).then(() => {
      return typedFetch(
        // 201 + uri
        `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${workspaceName}/channels/${channelName}/posts/`,
        {
          method: "PUT",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${this.token}`,
          },
        },
      );
    });
  }

  /**
   *Create a new workspace, prepare workspace to put channels in it
   *
   * @param {string} workspaceName - The name of the workspace to be created.
   * @returns {Promise<string>} A promise that resolves to a string indicating the success of the operation.
   *
   */
  createWorkspace(workspaceName: string): Promise<string> {
    const options = {
      method: "PUT",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    };

    // console.log("putting workspace and adding channels collection");

    console.log(
      options,
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}/${workspaceName}`,
    );

    return typedFetch(
      // response is 201 +  { "uri": "/v1/group18/workspace1" }
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}/${workspaceName}`,
      options,
    ).then(() => {
      return typedFetch(
        // response is 201 +  { "uri": "/v1/group18/workspace1/channels/" }
        `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}/${workspaceName}/channels/`,
        {
          method: "PUT",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${this.token}`,
          },
        },
      );
    });
  }

  /**
   * Open a specific workspace --> this workspace is supposed to have a collection called "channels" in the database
   * @param path The path to the workspace
   * @param validator Validation of workspace
   * @returns a promise that resolves to an array of of Channels
   */
  openWorkspace(path: string, validator: Validator): Promise<Array<Doc>> {
    // console.log(" clicked on opening a workspace:", path);
    console.log(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}/channels/`,
    );

    return typedFetch<Array<Doc>>( // code is 200
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}/channels/`,
      {
        headers: {
          // Add headers here
          accept: "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      },
    )
      .then((data) => {
        console.log(data);
        // Assuming each item in the array needs to be validated
        data.forEach((channelItem) => {
          // console.log("validating:", channelItem);

          if (!validator.validate(channelItem, "channel")) {
            // console.error('Validation error:', validator.ajv.errors); // Log specifi
            throw new Error("Invalid channel data");
          }
        });
        return data; // Return the validated data
      })
      .catch((error) => {
        console.error("Error during a single channel validation:", error);
        throw error; // Re-throw the error to be handled by the caller
      });
  }

  /**
   * Open a specific channel --> this channel is supposed to have a collection called "posts" in the database
   *
   * @returns a promise that resolves to an array of TODO fix this promise
   */
  putPostInDB(path: string, post: jsonDoc): Promise<Array<Doc>> {
    console.log(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}/posts/`,
    );

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    };

    return typedFetch<Array<Doc>>( // code is 201  and uri
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}/posts/`,
      options,
    );
  }

  /**
   * Open a specific channel --> this channel is supposed to have a collection called "posts" in the database
   * @param path The path to the channel
   * @param validator That validator for the channel
   * @returns a promise that resolves to an array of Docs.
   */
  openChannel(path: string, validator: Validator): Promise<Array<Doc>> {
    // // console.log(" clicked on opening a channel");

    console.log(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}/posts/`,
    );

    // // console.log("calling start subsription")
    // this.startSubscription( `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}`)

    return typedFetch<Array<Doc>>( // code 200  and [] if empty
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}/posts/`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      },
    )
      .then((data) => {
        // console.log(data);
        // Assuming each item in the array needs to be validated
        data.forEach((channelData) => {
          // console.log(channelData);
          if (!validator.validate(channelData, "post")) {
            // console.error('Validation error:', validator.ajv.errors); // Log specifi
            throw new Error("Invalid post data");
          }
          this.checkReactions(channelData);
        });
        return data; // Return the validated data
      })
      .catch((error) => {
        console.error("Error during a single post data validation:", error);
        throw error; // Re-throw the error to be handled by the caller
      });
  }

  checkReactions(response: string | object): void {
    // Parse the JSON string into an object, if it's not already an object
    const data = typeof response === "string" ? JSON.parse(response) : response;

    // Check if 'reactions' does not exist in 'doc'
    if (!data.doc || !("reactions" in data.doc)) {
      console.log("Reactions field does not exist-- call patch");
      this.addReactions(data.path);
    }
  }

  /**
   * Edits a channel
   * @param path Path to channel
   * @param newDescription Description of channel
   * @returns The result of typefetch
   */
  editChannel(path: string, newDescription: Array<Doc>): Promise<Array<Doc>> {
    return typedFetch<Array<Doc>>(
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}/posts/`,
      {
        headers: {
          // Add headers here
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      },
    );
  }

  /**
   * Delete an existing Workspace
   *
   * @param id the id of the workspace to delete
   * @returns  a promise that resolves to the id of the deleted ?
   */
  deleteWorkspace(id: string): Promise<string> {
    const options = {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
        accept: "*/*",
      },
    };

    // console.log("deleting:", id);

    console.log(
      options,
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${id}`,
    );

    return emptyFetch(
      // code is 204
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${id}`,
      options,
    ).then(() => {
      return id;
    });
  }

  /**
   * Delete an existing Channel
   *
   * @param id the id of the workspace to delete
   * @returns  a promise that resolves to the id of the deleted ?
   */
  deleteChannel(path: string): Promise<string> {
    const options = {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
        accept: "*/*",
      },
    };

    // console.log("deleting:", path);

    console.log(
      options,
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}`,
    );

    return emptyFetch(
      // response is only code 204
      `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${path}`,
      options,
    ).then(() => {
      return path;
    });
  }
}
