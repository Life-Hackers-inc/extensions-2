/*
 * @author: tisfeng
 * @createTime: 2022-07-01 19:05
 * @lastEditor: tisfeng
 * @lastEditTime: 2023-03-17 22:00
 * @fileName: versionInfo.ts
 *
 * Copyright (c) 2022 by tisfeng, All Rights Reserved.
 */

import { LocalStorage } from "@raycast/api";
import axios from "axios";
import { requestCostTime } from "../axiosConfig";

const versionInfoKey = "EasydictVersionInfoKey";
const githubUrl = "https://github.com";
const githubApiUrl = "https://api.github.com";

/**
 * Used for new release prompt.
 *
 * Todo: need to optimize the structure of this class.
 */
export class Easydict {
  static author = "tisfeng";
  static repo = "Raycast-Easydict";

  // * NOTE: this is new version info, don't use it directly. Use getCurrentStoredVersionInfo() instead.
  version = "2.8.0";
  buildNumber = 23;
  versionDate = "2023-03-17";
  isNeedPrompt = true;
  hasPrompted = false; // * always default false, only show once, then should be set to true.

  releaseMarkdown = `
## [v${this.version}] - ${this.versionDate}

### ✨ 新功能

- 支持 OpenAI ChatGPT 翻译。

#### 如果觉得这个扩展还不错，给个 [Star](https://github.com/tisfeng/Raycast-Easydict) ⭐️ 支持一下吧 (^-^)

## 推荐

我另一个项目，[Easydict](https://github.com/tisfeng/Easydict) ，一个简洁优雅的翻译词典 macOS App。开箱即用，支持离线 OCR 识别，支持有道词典，🍎苹果系统翻译，DeepL，谷歌，百度和火山翻译。

![iShot_2023-03-17_18.01.22_11zon-1679050206](https://raw.githubusercontent.com/tisfeng/ImageBed/main/uPic/iShot_2023-03-17_18.01.22_11zon-1679050206.jpg)

---

### ✨ Features

- Support OpenAI ChatGPT translation.
`;

  getRepoUrl() {
    return `${githubUrl}/${Easydict.author}/${Easydict.repo}`;
  }

  getReadmeUrl() {
    return `${githubUrl}/${Easydict.author}/${Easydict.repo}/#readme`;
  }

  getIssueUrl() {
    return `${githubUrl}/${Easydict.author}/${Easydict.repo}/issues`;
  }

  getCurrentReleaseTagUrl() {
    return `${this.getRepoUrl()}/releases/tag/${this.version}`;
  }

  chineseREADMEUrl = "https://github.com/tisfeng/Raycast-Easydict/blob/main/docs/README_ZH.md";

  /**
   * Chinese Wiki: https://github.com/tisfeng/Raycast-Easydict/wiki
   */
  public getChineseWikiUrl() {
    return `${this.getRepoUrl()}/wiki`;
  }

  /**
   *  Release tag url: /repos/{owner}/{repo}/releases/tags/{tag}
   *
   * * call this url will return a JSON object.
   *
   *  https://api.github.com/repos/tisfeng/Raycast-Easydict/releases/tags/1.2.0
   */
  public getReleaseApiUrl() {
    return `${githubApiUrl}/repos/${Easydict.author}/${Easydict.repo}/releases/tags/${this.version}`;
  }

  /**
   * Store current version info.
   */
  private storeCurrentVersionInfo() {
    const jsonString = JSON.stringify(this);
    const currentVersionKey = `${versionInfoKey}-${this.version}`;
    return LocalStorage.setItem(currentVersionKey, jsonString);
  }

  /**
   * Manually hide prompt when viewed,, and store hasPrompted.
   */
  public hideReleasePrompt() {
    this.hasPrompted = true;
    return this.storeCurrentVersionInfo();
  }

  /**
   * Get version info with version key, return a promise EasydictInfo.
   */
  async getVersionInfo(versionKey: string): Promise<Easydict | undefined> {
    const jsonString = await LocalStorage.getItem<string>(versionKey);
    if (!jsonString) {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(JSON.parse(jsonString));
  }

  /**
   * Get current version info, return a promise EasydictInfo.
   */
  async getCurrentVersionInfo(): Promise<Easydict> {
    const startTime = Date.now();
    const currentVersionKey = `${versionInfoKey}-${this.version}`;
    const currentEasydictInfo = await this.getVersionInfo(currentVersionKey);
    if (currentEasydictInfo) {
      // console.log(`get current easydict cost time: ${Date.now() - startTime} ms`);
      // console.log(`current easydict info: ${JSON.stringify(currentEasydictInfo, null, 4)}`);
      return Promise.resolve(currentEasydictInfo);
    } else {
      const startStoredTime = Date.now();
      await this.storeCurrentVersionInfo();
      console.log(`store version cost time: ${Date.now() - startStoredTime} ms`);
      console.log(`store and get current version cost time: ${Date.now() - startTime} ms`);
      return Promise.resolve(this);
    }
  }

  /**
   * Fetch release markdown, return a promise string. First, fetech markdown from github, if failed, then read from localStorage.
   *
   * * only show prompt once, whether fetch release markdown from github successful or failed.
   */
  public async fetchReleaseMarkdown(): Promise<string> {
    try {
      console.log(`fetch release markdown from github: ${this.getReleaseApiUrl()}`);
      const releaseInfo = await this.fetchReleaseInfo(this.getReleaseApiUrl());
      const releaseMarkdown = releaseInfo.body;
      console.log("fetch release markdown from github success");
      if (releaseMarkdown) {
        this.releaseMarkdown = releaseMarkdown;
        this.hasPrompted = true; // need to set hasPrompted to true when user viewed `ReleaseDetail` page.
        return Promise.resolve(releaseMarkdown);
      } else {
        console.error("fetch release markdown from github failed");
        return this.getLocalStoredMarkdown();
      }
    } catch (error) {
      console.error(`fetch release error: ${error}`);
      this.hasPrompted = true;
      return this.getLocalStoredMarkdown(); // getLocalStoredMarkdown() will store this info first.
    }
  }

  /**
   * Get local stored markdown, return a promise string.
   */
  public async getLocalStoredMarkdown(): Promise<string> {
    console.log(`get local storaged markdown`);
    const currentVersionInfo = await this.getCurrentVersionInfo();
    return Promise.resolve(currentVersionInfo.releaseMarkdown);
  }

  /**
   * Use axios to get github latest release, return a promise
   */
  public fetchReleaseInfo = async (releaseUrl: string) => {
    try {
      // console.log(`fetch release url: ${releaseUrl}`);
      const response = await axios.get(releaseUrl);
      console.log(`fetch github cost time: ${response.headers[requestCostTime]} ms`);

      return Promise.resolve(response.data);
    } catch (error) {
      return Promise.reject(error);
    }
  };
}
