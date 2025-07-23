_Last updated: July 22 2025_

Welcome to **StructOut**, an open‑source JSON‑schema designer hosted at <https://app.structout.dev> (the “**Site**”).  
By accessing the Site you **agree** to these Terms of Use (“**Terms**”). If you do not agree, please do not use the Site.

---

### 1. The Service  
StructOut is a client‑side, MIT‑licensed single‑page web application. All processing happens locally in your browser; we do not store your work on our servers.

### 2. License & Ownership
* Source code is released under the MIT License (see `LICENSE` in the GitHub repository).
* “StructOut” and the StructOut logo are trademarks of Sesh Ragavachari.
* Subject to these Terms, you receive a non‑exclusive, revocable right to use the hosted Site.

### 3. Acceptable Use  
You **must not**:
1. Violate any law or third‑party right while using the Site.

2. Introduce malware, attempt unauthorized access, or overload the Site.

3. Resell or misrepresent the Site as your own hosted service.

### 4. No Warranty  
THE SITE IS PROVIDED **“AS-IS” AND “AS AVAILABLE.”** WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON‑INFRINGEMENT.

### 5. Limitation of Liability  
TO THE MAXIMUM EXTENT PERMITTED BY LAW, STRUCTOUT’S TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED **USD $0.00**. WE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.

### 6. Modification & Termination  
We may modify or discontinue the Site at any time. You may stop using the Site at any time.

### 7. Governing Law & Disputes  
These Terms are governed by the laws of the **State of New Jersey, USA**, without regard to conflict‑of‑law rules.  
Any dispute arising out of or relating to the Site shall be brought **exclusively in the state or federal courts located in Mercer County, New Jersey**, and you consent to the personal jurisdiction of those courts.  
YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS OR REPRESENTATIVE ACTION.

### 8. Contact  
Email: **contact@structout.dev**

> **StructOut**  
> Attn: Sesh Ragavachari  
> 3495 US Highway 1, STE 34, #1211  
> Princeton, NJ 08540, USA

### 9. Third‑Party LLM API Keys

1. **User‑Supplied Keys**: StructOut lets you enter an API key issued by a third‑party large‑language‑model (LLM) provider. You are solely responsible for that key and for any charges the provider bills to your account.

2. **Token Consumption**: All compute tokens consumed by your prompts are metered and billed **directly by the LLM provider**, not by StructOut.

3. **Key Storage & Encryption**: If you opt into *“Remember my key,”* the key is stored **locally** on your device via the OS keyring and encrypted at rest. A pass‑phrase you supply is held **in memory only** and purged after **15 minutes** of inactivity.

4. **Security Disclaimer**: While StructOut uses reasonable safeguards, no security measure is infallible. You assume the risk of key compromise and agree that StructOut is **not liable** for any unauthorized usage or costs.

5. **Key Revocation**: You may remove, replace, or purge stored API keys at any time by running
   * `python secure_key.py purge` **(command‑line)**, or
   * launching the **Secure‑Key Setup GUI** with `python secure_key_gui.py`,  
     as described in the StructOut documentation.

### 10. Token‑Usage Costs

1. **Token Consumption**: When you run the download bundle produced by StructOut, they consume LLM Tokens.
2. **Billings for Token**: Compute Tokens are metered and billed **directly by the LLM provider**, not by StructOut.
3. **Responsibilty**: You, the user are responsible for managing LLM API Account, Pricing, Quotas, Usage, billing liability from LLM Provider**


### 11. Prompts Sent to Third‑Party LLMs

1. **Private or Sensitive Data**: Prompts are transmitted to your chosen LLM provider. **Do not include personal data, trade secrets, or other confidential information** unless you have confirmed the provider’s data‑handling practices meet your obligations.

2. **Prohibited Prompt Content**: You agree **not** to use StructOut—hosted or self‑hosted—to generate, transmit, or facilitate:
   * unlawful, harmful, violent, harassing, defamatory, obscene, or hateful material;
   * instructions or content enabling wrongdoing or weapon creation;
   * content that infringes intellectual‑property or privacy rights; or
   * spam or unsolicited commercial messages.

   **Because StructOut runs entirely on your device, the project’s author cannot monitor or filter prompts.** You are solely responsible for complying with these rules and with the LLM provider’s policy. The author disclaims all liability arising from prompts you submit.

### 12. Technical Skill Prerequisites & Support

1. **Required Skills**: Using the downloadable StructOut bundle assumes familiarity with including but not limited to:
  * a code editor or IDE (e.g., Visual Studio Code, PyCharm, etc...);
  * Python 3.12 or later and virtual‑environment tools;
  * running command‑line scripts.

2. **User Responsibility**: You are responsible for configuring your environment, installing dependencies, and operating these scripts. StructOut provides **community support only** via GitHub Issues.

3. **Compatibility Disclaimer**: We do not guarantee compatibility with every operating system, Python distribution, or IDE plug‑in.

---
