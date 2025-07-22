# Technical Write-Up: Sprint 2 Summary – Technical Progress Update

* **Project:** Contextual Identity API
* **Developer:** Antonio Simoes
* **Sprint Period:** Week 13 - Week 14
* **Date:** 09.07.2025

---

## Executive Summary

Sprint 2 focused on solidifying the application's core functionality, with a significant emphasis on refining the user experience and internal UI architecture. We successfully integrated key authentication and dashboard modules, transitioned to a more robust global state management system using Zustand, and began a systematic UI refinement process by leveraging a component library approach. This has led to a more stable, consistent, and maintainable frontend application, setting a strong foundation for future feature development.

---

## 1. Project Overview

* **Project Goal:** To create an API enabling users to manage their identity attributes and selectively share specific data sets (contexts) with different applications, enhancing user privacy.

* **Key Idea:** Provide granular control over personal data disclosure in various digital interactions.

* **Technologies:** Java (Spring Boot), React JS, MongoDB, Liquibase.

  ![System Architecture](img/sprint-1-system-architecture.png)

---

## 2. Phase 1: Authentication and User Management Refinements

#### Objective

To enhance the authentication flow, improve the robustness of the user dashboard, and prepare the system for client application integration by refining security and data handling.

#### Key Achievements (Point 1 of Phase 1)

We successfully integrated the `login-prompt` and `user-dashboard` components into a single, cohesive application, resolving critical issues related to styling and inter-application communication. This involved:

* **Unified Styling:** Addressed the conflicting `App.css` files by strategically merging their contents. This ensured consistent visual presentation across the integrated `login-prompt` and the `user-dashboard` sections, maintaining the intended look and feel after the merge.
* **Robust `postMessage` Communication:** Corrected the `sample-client`'s inability to receive data from the authentication popup. This was achieved by:
    * **Aligning `postMessage` Structure:** Identified and rectified the mismatch in the expected data structure, specifically removing the erroneous `event.data.payload` check in the `sample-client`. The `sample-client` now directly accesses the authentication data (e.g., `token`, `userId`, `username`, `contextualAttributes`) from `event.data`.
    * **`type` Consistency:** Ensured that the `type` field in the `postMessage` payload from the `ContextSelectionPage` (e.g., `'CONTEXT_AUTH_SUCCESS'`) correctly matched the expected type in the `sample-client`'s listener.
* **Stabilized Dashboard Data Fetching:** Rectified the issue where the user dashboard appeared empty post-login and failed to fetch data. This was resolved by:
    * **Direct `AuthContext` Consumption:** Modified `DashboardPage` to directly consume `userInfo` and authentication status from `AuthContext` via the `useAuth()` hook, eliminating its reliance on props that were not being passed.
    * **Adherence to React Hooks Rules (`useCallback` for Stability):** Addressed `React Hook is called conditionally` errors and prevented infinite rendering loops. This crucial fix involved:
        * Restructuring `DashboardPage` to ensure all Hook calls (`useState`, `useEffect`, `useCallback`) are at the top level, before any conditional renders.
        * Implementing `useCallback` for the `callApi` function within the `useApi` hook. This made the `callApi` reference stable across renders, which in turn stabilized the `fetchDashboardData` function's reference. This eliminated the infinite re-renders and allowed `fetchDashboardData` to be correctly included in `useEffect`'s dependency array, ensuring data is fetched reliably when `userInfo` or authentication status changes.
* **Refined Global State Management with Zustand:** Transitioned critical, application-wide state management from React's Context API to Zustand stores, specifically for `identityStore` and `authenticationStore`. This enhancement provided:
    * **Centralized Data Management:** The `identityStore` now acts as a single source of truth for contexts and attributes, simplifying data flow and ensuring consistency across the application components (e.g., `DashboardPage`, `ContextSelectionPage`).
    * **Optimized Popup State:** Introduced `authenticationStore` to specifically manage the transient selection state (`selectedContextId`, `selectedAttributeIds`) within the authentication popup. This keeps the popup's state clean and isolated from the main application's global state, improving modularity and preventing unintended side effects.
    * **Simplified Data Access:** Components now directly subscribe to relevant parts of the Zustand stores, reducing the need for prop drilling and simplifying state updates across the component tree.
    * **Improved Performance:** Zustand's optimized rendering, only re-rendering components that use changed state, contributes to better application performance compared to broader Context API updates.
    * **Enhanced Readability & Maintainability:** The clear separation of concerns in Zustand stores (e.g., `identityStore` for data, `authenticationStore` for specific UI flow state) makes the codebase easier to understand and maintain.

---

## 3. Phase 2: UI Refinement & Componentization

#### Objective

To enhance the visual consistency and modularity of the user interface by refactoring existing UI elements into reusable components and systematically replacing native browser prompts with custom, branded UI elements.

#### Key Achievements

* **Refactored UI Modules & Introduced Component Library Concept (Tasks 2 & 3):**
    * Adopted a structured approach to UI development by extensively leveraging **Chakra UI** as our foundational component library. This provides a rich set of pre-built, accessible, and customizable atomic components (e.g., `Button`, `Input`, `Box`, `SimpleGrid`, `Modal`, `AlertDialog`, `Tag`).
    * Developed distinct, highly reusable content modules such as `ContextsContent` and `AttributesContent`. These components are responsible for specific sections of the user dashboard, encapsulating their own logic and presentation.
    * Ensured a clear **separation of concerns** by designing components to focus on single responsibilities, enhancing modularity and making the UI easier to manage and scale.
    * Improved consistency in styling and behavior across the application by adhering to Chakra UI's design principles and utility props.

* **Replaced Native `window.confirm` with Custom Modals (Task 4):**
    * Successfully eliminated all instances of native browser `window.confirm` dialogs, which offer limited styling and branding capabilities.
    * Systematically replaced these with Chakra UI's **`AlertDialog`** component. This ensures all user confirmations, such as attribute or context deletions, are now handled by a consistent, branded, and visually integrated modal within the application's UI.
    * This change significantly enhances the overall **User Experience (UX)** by providing a seamless visual flow and control over the confirmation process, preventing jarring native pop-ups.
    * For example, deletion confirmations in both `ContextsContent` and `AttributesContent` now utilize the `AlertDialog` for a unified look and feel.