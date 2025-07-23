# StructOut – Privacy Notice
_Last updated: July 22, 2025_

StructOut is designed to run **100% in your browser**. This Notice explains what limited information is collected and how it is used.

---

## 1. What We *Do Not* Collect
* JSON schemas, prompts, code, models, or any other content you create.
* Cookies, analytics IDs, advertising trackers, or fingerprinting scripts.

All such data stays on your device unless *you* download or copy it elsewhere.

## 2 Edge Logs  
Our static host (Cloudflare Pages) automatically records standard HTTP access logs—IP address, user‑agent, timestamp, requested file—for security and debugging. Retention Policy is set by edge hosting provider.


## 3. API Keys & Local Storage
* If you choose to use the bundled Keyring API Key Management code,  the API keys are encrypted and saved in your OS keyring (on your machine)
* If you choose to Save the JSON Schema it is saved in your browser Local Storage, we do not transmit this outside your machine.
* The pass‑phrase remains in your computer memory for **10 minutes** (by default) of inactivity, then is purged.
* Clearing your browser’s site data removes Local Storage content.
* To erase the API Keys permanently the secure_key_gui.py or secure_key must be used.

StructOut never transmits or syncs your keys or Content to any server controlled by us.

## 4. LLM Prompts  
When you invoke an LLM feature, the prompt text is sent **directly from your browser to your chosen LLM provider**. StructOut does not intermediate, log, or store this text. Review the provider’s privacy policy for how they handle your prompts.

## 5. Voluntary Correspondence  
If you email us, we keep your message and address only long enough to respond, then delete them from our mailbox archives after 90 days.

## 6. Your Choices
* Close the browser tab to stop using StructOut.
* Delete local data via your browser’s “Clear Site Data” controls.
* Remove or purge stored API keys by running `python secure_key.py purge` or using `python secure_key_gui.py`.

## 7. Changes to This Notice  
Material changes will be posted at <https://structout.dev/privacy> and the “Last updated” date will change.

## 8. Contact  
Email: **contact@structout.dev**

> **StructOut**  
> Attn: Sesh Ragavachari  
> 3495 US Highway 1, STE 34 #1211  
> Princeton, NJ 08540, USA

---
