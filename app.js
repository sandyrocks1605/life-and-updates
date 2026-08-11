// ============================================================
// LIFE AND UPDATES — app.js
// ============================================================

// ------------------------------------------------------------
// SUPABASE CONNECTION
// ------------------------------------------------------------

const configured =
    typeof window.supabase !== "undefined" &&
    window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("PASTE_") &&
    !window.SUPABASE_ANON_KEY.includes("PASTE_");

const sb = configured
    ? window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    )
    : null;


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const $ = selector => document.querySelector(selector);

const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));

function showMessage(selector, text, type = "notice") {
    const element = $(selector);

    if (!element) return;

    element.className = `notice ${type}`;
    element.textContent = text;
}

function connectionError() {
    return "The website cannot connect to Supabase. Please check config.js.";
}


// ------------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------------

async function getSession() {

    if (!sb) return null;

    const { data, error } = await sb.auth.getSession();

    if (error) {
        console.error("Session error:", error);
        return null;
    }

    return data?.session || null;
}


async function getProfile() {

    const session = await getSession();

    if (!session) return null;

    const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile error:", error);
        return null;
    }

    return data || null;
}


// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

async function login(event) {

    event.preventDefault();

    if (!sb) {
        showMessage("#msg", connectionError(), "error");
        return;
    }

    const email = $("#email").value.trim();
    const password = $("#password").value;

    showMessage("#msg", "Signing in…");

    const { data, error } =
        await sb.auth.signInWithPassword({
            email,
            password
        });

    if (error) {

        let message = error.message;

        if (/invalid login credentials/i.test(message)) {
            message = "Email or password is incorrect.";
        }

        if (/email not confirmed/i.test(message)) {
            message =
                "Please confirm your email first, then try logging in again.";
        }

        showMessage("#msg", message, "error");

        return;
    }

    if (data?.session) {

        window.location.href = "dashboard.html";

    } else {

        showMessage(
            "#msg",
            "Login succeeded, but no session was returned. Please try again.",
            "error"
        );
    }
}


// ------------------------------------------------------------
// CREATE ACCOUNT
// ------------------------------------------------------------

async function signup(event) {

    event.preventDefault();

    if (!sb) {
        showMessage("#msg", connectionError(), "error");
        return;
    }

    const email = $("#email").value.trim();
    const password = $("#password").value;

    if (password.length < 8) {

        showMessage(
            "#msg",
            "Password must contain at least 8 characters.",
            "error"
        );

        return;
    }

    showMessage("#msg", "Creating your account…");

    const { data, error } =
        await sb.auth.signUp({
            email,
            password,

            options: {
                emailRedirectTo:
                    "https://sandyrocks1605.github.io/life-and-updates/login.html"
            }
        });

    if (error) {

        showMessage(
            "#msg",
            error.message,
            "error"
        );

        return;
    }

    if (data?.session) {

        showMessage(
            "#msg",
            "Account created successfully. You can now log in.",
            "success"
        );

    } else {

        showMessage(
            "#msg",
            "Account created! Check your email and click the confirmation link before logging in.",
            "success"
        );
    }
}


// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------

async function logout() {

    if (sb) {
        await sb.auth.signOut();
    }

    window.location.href = "index.html";
}


// ------------------------------------------------------------
// EDITOR PROTECTION
// ------------------------------------------------------------

async function protectDashboard() {

    if (!sb) {

        document.body.innerHTML = `
            <div class="container">
                <div class="notice error">
                    Supabase is not connected.
                </div>
            </div>
        `;

        return null;
    }

    const session = await getSession();

    if (!session) {

        window.location.href = "login.html";

        return null;
    }

    const profile = await getProfile();

    if (!profile) {

        document.body.innerHTML = `
            <div class="container">
                <div class="notice error">
                    <strong>Your profile was not found.</strong>
                    <br><br>
                    Please run the latest Supabase SQL setup.
                </div>

                <a class="btn dark" href="index.html">
                    Back to site
                </a>
            </div>
        `;

        return null;
    }

    if (profile.role !== "editor") {

        document.body.innerHTML = `
            <div class="container">

                <div class="notice error">

                    <strong>Access denied.</strong>

                    <br><br>

                    This account is a Student account.

                    <br>

                    Only authorised Editors can manage notes.

                </div>

                <a class="btn dark" href="index.html">
                    Back to site
                </a>

            </div>
        `;

        return null;
    }

    const emailElement = $("#editorEmail");

    if (emailElement) {
        emailElement.textContent = profile.email || "";
    }

    return profile;
}


// ============================================================
// SUBJECT-WISE NOTES SYSTEM
// ============================================================


// ------------------------------------------------------------
// SUBJECT LIST
// ------------------------------------------------------------

const SUBJECTS = {

    Mathematics: {
        icon: "➗",
        description: "Numbers, formulas and problem solving"
    },

    Science: {
        icon: "🔬",
        description: "Physics, chemistry and biology"
    },

    "Social Science": {
        icon: "🌍",
        description: "History, geography and civics"
    },

    English: {
        icon: "📖",
        description: "Literature, grammar and writing"
    },

    Hindi: {
        icon: "अ",
        description: "हिंदी पाठ, व्याकरण और लेखन"
    },

    Marathi: {
        icon: "अ",
        description: "मराठी पाठ, व्याकरण आणि लेखन"
    },

    "C.Marathi": {
        icon: "📘",
        description: "Classwork and revision"
    },

    Sanskrit: {
        icon: "🪷",
        description: "संस्कृत पाठ और व्याकरण"
    },

    Computer: {
        icon: "💻",
        description: "Computers, coding and technology"
    },

    Other: {
        icon: "⭐",
        description: "Projects and other material"
    }
};


// ------------------------------------------------------------
// SHOW SUBJECTS
// ------------------------------------------------------------

function showSubjects() {

    const subjectContainer = $("#subjectGrid");

    const notesContainer = $("#notesArea");

    if (!subjectContainer) return;

    subjectContainer.classList.remove("hidden");

    if (notesContainer) {
        notesContainer.classList.add("hidden");
    }

    subjectContainer.innerHTML =
        Object.entries(SUBJECTS)
            .map(([subject, info]) => `

                <button
                    class="card subject-card"
                    type="button"
                    data-subject="${escapeHTML(subject)}"
                    style="text-align:left;cursor:pointer"
                >

                    <div class="icon">
                        ${info.icon}
                    </div>

                    <h3>
                        ${escapeHTML(subject)}
                    </h3>

                    <p>
                        ${escapeHTML(info.description)}
                    </p>

                </button>

            `)
            .join("");

    document
        .querySelectorAll("[data-subject]")
        .forEach(button => {

            button.addEventListener("click", () => {

                loadSubjectNotes(
                    button.dataset.subject
                );

            });

        });
}


// ------------------------------------------------------------
// LOAD NOTES FOR ONE SUBJECT
// ------------------------------------------------------------

async function loadSubjectNotes(subject, search = "") {

    const subjectContainer = $("#subjectGrid");

    const notesContainer = $("#notesArea");

    const notesList = $("#notesList");

    const subjectTitle = $("#selectedSubject");

    const searchBox = $("#subjectSearch");

    if (!notesContainer || !notesList) return;

    if (subjectContainer) {
        subjectContainer.classList.add("hidden");
    }

    notesContainer.classList.remove("hidden");

    if (subjectTitle) {

        const info = SUBJECTS[subject];

        subjectTitle.textContent =
            `${info?.icon || "📚"} ${subject} Notes`;

    }

    if (searchBox) {

        searchBox.value = search;

        searchBox.dataset.subject = subject;
    }

    notesList.innerHTML =
        `<div class="notice">Loading ${escapeHTML(subject)} notes…</div>`;

    if (!sb) {

        notesList.innerHTML =
            `<div class="notice error">
                ${connectionError()}
            </div>`;

        return;
    }

    let query =
        sb
            .from("notes")
            .select("*")
            .eq("subject", subject)
            .order("created_at", {
                ascending: false
            });

    if (search) {

        query =
            query.or(
                `title.ilike.%${search}%,chapter.ilike.%${search}%,description.ilike.%${search}%`
            );
    }

    const { data, error } = await query;

    if (error) {

        console.error(error);

        notesList.innerHTML =
            `<div class="notice error">
                ${escapeHTML(error.message)}
            </div>`;

        return;
    }

    if (!data || data.length === 0) {

        notesList.innerHTML = `
            <div class="notice">

                No notes found for
                <strong>${escapeHTML(subject)}</strong>.

            </div>
        `;

        return;
    }

    notesList.innerHTML =
        data
            .map(note => {

                const date =
                    note.created_at
                        ? new Date(note.created_at)
                            .toLocaleDateString()
                        : "";

                return `

                    <article class="note">

                        <div>

                            <div class="muted">

                                ${escapeHTML(note.chapter || "General")}

                                ${date ? ` • ${date}` : ""}

                            </div>

                            <h3>
                                ${escapeHTML(note.title)}
                            </h3>

                            <p>

                                ${escapeHTML(
                                    note.description || ""
                                )}

                                ${
                                    note.important
                                        ? " ⭐ Important"
                                        : ""
                                }

                            </p>

                        </div>

                        <div class="note-actions">

                            ${
                                note.file_url

                                    ? `
                                        <a
                                            class="btn primary"
                                            target="_blank"
                                            rel="noopener"
                                            href="${escapeHTML(note.file_url)}"
                                        >
                                            📄 Open Note
                                        </a>
                                      `

                                    : ""
                            }

                        </div>

                    </article>

                `;

            })
            .join("");
}


// ------------------------------------------------------------
// SEARCH WITHIN SUBJECT
// ------------------------------------------------------------

function searchSubjectNotes() {

    const searchBox = $("#subjectSearch");

    if (!searchBox) return;

    const subject =
        searchBox.dataset.subject;

    const search =
        searchBox.value.trim();

    if (!subject) return;

    loadSubjectNotes(
        subject,
        search
    );
}


// ------------------------------------------------------------
// BACK TO SUBJECTS
// ------------------------------------------------------------

function backToSubjects() {

    const notesContainer = $("#notesArea");

    if (notesContainer) {
        notesContainer.classList.add("hidden");
    }

    showSubjects();
}


// ============================================================
// EDITOR NOTE UPLOAD
// ============================================================

async function uploadNote(event) {

    event.preventDefault();

    if (!sb) {

        showMessage(
            "#uploadMsg",
            connectionError(),
            "error"
        );

        return;
    }

    const profile =
        await getProfile();

    if (
        !profile ||
        profile.role !== "editor"
    ) {

        showMessage(
            "#uploadMsg",
            "Editor access is required.",
            "error"
        );

        return;
    }

    const file =
        $("#file").files[0];

    if (!file) {

        showMessage(
            "#uploadMsg",
            "Please choose a file.",
            "error"
        );

        return;
    }

    // 15 MB maximum

    if (
        file.size >
        15 * 1024 * 1024
    ) {

        showMessage(
            "#uploadMsg",
            "Maximum file size is 15 MB.",
            "error"
        );

        return;
    }

    showMessage(
        "#uploadMsg",
        "Uploading note…"
    );

    const safeName =
        file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

    const path =
        `${crypto.randomUUID()}-${safeName}`;


    // --------------------------------------------------------
    // UPLOAD FILE
    // --------------------------------------------------------

    const uploadResult =
        await sb.storage
            .from("notes")
            .upload(
                path,
                file,
                {
                    upsert: false
                }
            );

    if (uploadResult.error) {

        showMessage(
            "#uploadMsg",
            uploadResult.error.message,
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // GET PUBLIC FILE URL
    // --------------------------------------------------------

    const publicURL =
        sb.storage
            .from("notes")
            .getPublicUrl(path)
            .data
            .publicUrl;


    // --------------------------------------------------------
    // SAVE NOTE INFORMATION
    // --------------------------------------------------------

    const insertResult =
        await sb
            .from("notes")
            .insert({

                title:
                    $("#title")
                        .value
                        .trim(),

                subject:
                    $("#subject")
                        .value,

                chapter:
                    $("#chapter")
                        .value
                        .trim(),

                description:
                    $("#description")
                        .value
                        .trim(),

                important:
                    $("#important")
                        .checked,

                file_url:
                    publicURL,

                file_path:
                    path,

                created_by:
                    profile.id

            });


    if (insertResult.error) {

        // Delete uploaded file if
        // database insertion fails.

        await sb.storage
            .from("notes")
            .remove([path]);

        showMessage(
            "#uploadMsg",
            insertResult.error.message,
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    showMessage(
        "#uploadMsg",
        "Note uploaded successfully!",
        "success"
    );

    $("#uploadForm").reset();

    loadAdminNotes();
}


// ============================================================
// ADMIN NOTE LIST
// ============================================================

async function loadAdminNotes() {

    const table =
        $("#adminNotes");

    if (!table || !sb) return;

    const { data, error } =
        await sb
            .from("notes")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        (data || [])
            .map(note => `

                <tr>

                    <td>
                        ${escapeHTML(note.title)}
                    </td>

                    <td>
                        ${escapeHTML(note.subject)}
                    </td>

                    <td>
                        ${escapeHTML(
                            note.chapter || ""
                        )}
                    </td>

                    <td>
                        ${
                            note.created_at
                                ? new Date(
                                    note.created_at
                                ).toLocaleDateString()
                                : ""
                        }
                    </td>

                    <td>

                        <button
                            class="btn danger"
                            onclick="deleteNote(
                                '${note.id}',
                                '${escapeHTML(
                                    note.file_path || ""
                                )}'
                            )"
                        >
                            🗑️ Delete
                        </button>

                    </td>

                </tr>

            `)
            .join("");
}


// ============================================================
// DELETE NOTE
// ============================================================

async function deleteNote(
    noteID,
    filePath
) {

    if (
        !confirm(
            "Are you sure you want to delete this note?"
        )
    ) {
        return;
    }

    if (!sb) return;


    // Delete database record

    const { error } =
        await sb
            .from("notes")
            .delete()
            .eq("id", noteID);

    if (error) {

        alert(error.message);

        return;
    }


    // Delete actual file

    if (filePath) {

        await sb.storage
            .from("notes")
            .remove([filePath]);

    }


    loadAdminNotes();
}


// ============================================================
// INITIALISE WEBSITE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        // Login page

        if ($("#loginForm")) {

            $("#loginForm")
                .addEventListener(
                    "submit",
                    login
                );

        }


        // Signup page

        if ($("#signupForm")) {

            $("#signupForm")
                .addEventListener(
                    "submit",
                    signup
                );

        }


        // Logout

        if ($("#logout")) {

            $("#logout")
                .addEventListener(
                    "click",
                    logout
                );

        }


        // Editor upload

        if ($("#uploadForm")) {

            $("#uploadForm")
                .addEventListener(
                    "submit",
                    uploadNote
                );

        }


        // Homepage subject system

        if ($("#subjectGrid")) {

            showSubjects();

        }


        // Subject search

        if ($("#subjectSearch")) {

            $("#subjectSearch")
                .addEventListener(
                    "input",
                    searchSubjectNotes
                );

        }


        // Back button

        if ($("#backToSubjects")) {

            $("#backToSubjects")
                .addEventListener(
                    "click",
                    backToSubjects
                );

        }


        // Editor dashboard

        if ($("#dashboard")) {

            const profile =
                await protectDashboard();

            if (profile) {

                await loadAdminNotes();

            }

        }

    }
);
