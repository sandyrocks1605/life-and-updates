// ============================================================
// LIFE AND UPDATES — app.js
// ============================================================


// ============================================================
// SUPABASE CONNECTION
// ============================================================

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


// ============================================================
// BASIC HELPERS
// ============================================================

const $ = selector => document.querySelector(selector);


function escapeHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character])
    );

}


function showMessage(
    selector,
    text,
    type = "notice"
) {

    const element = $(selector);

    if (!element) return;

    element.className =
        `notice ${type}`;

    element.textContent =
        text;

}


function connectionError() {

    return (
        "Life And Updates cannot connect to Supabase. " +
        "Please check config.js."
    );

}


// ============================================================
// SUBJECTS
// ============================================================

const SUBJECTS = {

    "Math": {
        icon: "➗",
        description:
            "Mathematics, formulas and problem solving"
    },

    "English": {
        icon: "📖",
        description:
            "Literature, grammar and writing"
    },

    "Biology": {
        icon: "🧬",
        description:
            "Living organisms and life science"
    },

    "Chemistry": {
        icon: "🧪",
        description:
            "Matter, reactions and chemistry"
    },

    "Physics": {
        icon: "⚛️",
        description:
            "Motion, forces, energy and physics"
    },

    "Social Science": {
        icon: "🌍",
        description:
            "History, geography and civics"
    },

    "Hindi": {
        icon: "अ",
        description:
            "हिंदी पाठ, व्याकरण और लेखन"
    },

    "C.Marathi": {
        icon: "📘",
        description:
            "C.Marathi notes and study material"
    },

    "Marathi": {
        icon: "🪷",
        description:
            "मराठी पाठ, व्याकरण आणि लेखन"
    },

    "Sanskrit": {
        icon: "🕉️",
        description:
            "संस्कृत पाठ और व्याकरण"
    }

};


// ============================================================
// AUTHENTICATION
// ============================================================


// ------------------------------------------------------------
// GET CURRENT SESSION
// ------------------------------------------------------------

async function getSession() {

    if (!sb) return null;

    const {
        data,
        error
    } = await sb.auth.getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        return null;
    }


    return data?.session || null;

}


// ------------------------------------------------------------
// GET USER PROFILE
// ------------------------------------------------------------

async function getProfile() {

    const session =
        await getSession();


    if (!session) return null;


    const {
        data,
        error
    } = await sb
        .from("profiles")
        .select("*")
        .eq(
            "id",
            session.user.id
        )
        .maybeSingle();


    if (error) {

        console.error(
            "Profile error:",
            error
        );

        return null;
    }


    return data || null;

}


// ============================================================
// LOGIN
// ============================================================

async function login(event) {

    event.preventDefault();


    if (!sb) {

        showMessage(
            "#msg",
            connectionError(),
            "error"
        );

        return;
    }


    const email =
        $("#email")
            .value
            .trim();


    const password =
        $("#password")
            .value;


    showMessage(
        "#msg",
        "Signing in..."
    );


    const {
        data,
        error
    } =
        await sb.auth.signInWithPassword({

            email,
            password

        });


    if (error) {

        let message =
            error.message;


        if (
            /invalid login credentials/i
                .test(message)
        ) {

            message =
                "Email or password is incorrect.";

        }


        if (
            /email not confirmed/i
                .test(message)
        ) {

            message =
                "Please confirm your email first, then try logging in again.";

        }


        showMessage(
            "#msg",
            message,
            "error"
        );


        return;

    }


    if (data?.session) {

        window.location.href =
            "dashboard.html";

    }

}


// ============================================================
// CREATE ACCOUNT
// ============================================================

async function signup(event) {

    event.preventDefault();


    if (!sb) {

        showMessage(
            "#msg",
            connectionError(),
            "error"
        );

        return;
    }


    const email =
        $("#email")
            .value
            .trim();


    const password =
        $("#password")
            .value;


    if (password.length < 8) {

        showMessage(
            "#msg",
            "Password must contain at least 8 characters.",
            "error"
        );

        return;
    }


    showMessage(
        "#msg",
        "Creating your account..."
    );


    const {
        data,
        error
    } =
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

    }

    else {

        showMessage(
            "#msg",
            "Account created! Check your email and confirm your account before logging in.",
            "success"
        );

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    if (sb) {

        await sb.auth.signOut();

    }


    window.location.href =
        "index.html";

}


// ============================================================
// SUBJECT PAGE
// ============================================================


// ------------------------------------------------------------
// CREATE SUBJECT BUTTONS
// ------------------------------------------------------------

function showSubjects() {

    const subjectGrid =
        $("#subjectGrid");


    const notesArea =
        $("#notesArea");


    if (!subjectGrid) return;


    if (notesArea) {

        notesArea.classList.add(
            "hidden"
        );

    }


    subjectGrid.classList.remove(
        "hidden"
    );


    subjectGrid.innerHTML = "";


    Object.entries(
        SUBJECTS
    )
        .forEach(
            ([subject, info]) => {


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "subject-card";


                button.dataset.subject =
                    subject;


                button.innerHTML = `

                    <div class="icon">

                        ${info.icon}

                    </div>

                    <h3>

                        ${escapeHTML(subject)}

                    </h3>

                    <p>

                        ${escapeHTML(
                            info.description
                        )}

                    </p>

                `;


                button.addEventListener(
                    "click",
                    () => {

                        loadSubjectNotes(
                            subject
                        );

                    }
                );


                subjectGrid.appendChild(
                    button
                );

            }
        );

}


// ============================================================
// LOAD NOTES FOR SELECTED SUBJECT
// ============================================================

async function loadSubjectNotes(
    subject,
    search = ""
) {

    const subjectGrid =
        $("#subjectGrid");


    const notesArea =
        $("#notesArea");


    const notesList =
        $("#notesList");


    const subjectTitle =
        $("#selectedSubject");


    const searchBox =
        $("#subjectSearch");


    if (!notesArea ||
        !notesList) {

        return;

    }


    // Hide subjects

    if (subjectGrid) {

        subjectGrid.classList.add(
            "hidden"
        );

    }


    // Show notes

    notesArea.classList.remove(
        "hidden"
    );


    // Subject title

    const info =
        SUBJECTS[subject];


    if (subjectTitle) {

        subjectTitle.textContent =
            `${info?.icon || "📚"} ${subject} Notes`;

    }


    // Search box

    if (searchBox) {

        searchBox.value =
            search;

        searchBox.dataset.subject =
            subject;

    }


    notesList.innerHTML = `

        <div class="notice">

            Loading
            ${escapeHTML(subject)}
            notes...

        </div>

    `;


    if (!sb) {

        notesList.innerHTML = `

            <div class="notice error">

                ${connectionError()}

            </div>

        `;

        return;

    }


    // --------------------------------------------------------
    // SUPABASE QUERY
    // --------------------------------------------------------

    let query =
        sb
            .from("notes")
            .select("*")
            .eq(
                "subject",
                subject
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    // Search within subject

    if (search) {

        query =
            query.or(

                `title.ilike.%${search}%,` +
                `chapter.ilike.%${search}%,` +
                `description.ilike.%${search}%`

            );

    }


    const {
        data,
        error
    } =
        await query;


    if (error) {

        console.error(error);


        notesList.innerHTML = `

            <div class="notice error">

                ${escapeHTML(
                    error.message
                )}

            </div>

        `;


        return;

    }


    // No notes

    if (
        !data ||
        data.length === 0
    ) {

        notesList.innerHTML = `

            <div class="notice">

                No notes found for

                <strong>
                    ${escapeHTML(subject)}
                </strong>.

            </div>

        `;

        return;

    }


    // --------------------------------------------------------
    // DISPLAY NOTES
    // --------------------------------------------------------

    notesList.innerHTML =
        data
            .map(note => {

                const date =
                    note.created_at
                        ? new Date(
                            note.created_at
                        ).toLocaleDateString()
                        : "";


                return `

                    <article class="note">

                        <div>

                            <div class="muted">

                                ${escapeHTML(
                                    note.chapter ||
                                    "General"
                                )}

                                ${
                                    date
                                        ? ` • ${date}`
                                        : ""
                                }

                            </div>


                            <h3>

                                ${escapeHTML(
                                    note.title
                                )}

                            </h3>


                            <p>

                                ${escapeHTML(
                                    note.description ||
                                    ""
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
                                            href="${escapeHTML(
                                                note.file_url
                                            )}"
                                            target="_blank"
                                            rel="noopener"
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


// ============================================================
// SEARCH INSIDE SUBJECT
// ============================================================

function searchSubjectNotes() {

    const searchBox =
        $("#subjectSearch");


    if (!searchBox) return;


    const subject =
        searchBox.dataset.subject;


    if (!subject) return;


    const search =
        searchBox
            .value
            .trim();


    loadSubjectNotes(
        subject,
        search
    );

}


// ============================================================
// BACK TO SUBJECTS
// ============================================================

function backToSubjects() {

    const notesArea =
        $("#notesArea");


    if (notesArea) {

        notesArea.classList.add(
            "hidden"
        );

    }


    showSubjects();

}


// ============================================================
// EDITOR DASHBOARD SECURITY
// ============================================================

async function protectDashboard() {

    if (!sb) {

        document.body.innerHTML = `

            <div class="container">

                <div class="notice error">

                    ${connectionError()}

                </div>

            </div>

        `;

        return null;

    }


    const session =
        await getSession();


    if (!session) {

        window.location.href =
            "login.html";

        return null;

    }


    const profile =
        await getProfile();


    if (!profile) {

        document.body.innerHTML = `

            <div class="container">

                <div class="notice error">

                    <strong>
                        Your account profile was not found.
                    </strong>

                    <br><br>

                    Please run the latest
                    Supabase SQL setup.

                </div>


                <a
                    class="btn dark"
                    href="index.html"
                >

                    Back to site

                </a>

            </div>

        `;

        return null;

    }


    // Only Editors

    if (
        profile.role !==
        "editor"
    ) {

        document.body.innerHTML = `

            <div class="container">

                <div class="notice error">

                    <strong>
                        Access denied.
                    </strong>

                    <br><br>

                    This account is a
                    Student account.

                    <br>

                    Only authorised Editors
                    can manage notes.

                </div>


                <a
                    class="btn dark"
                    href="index.html"
                >

                    Back to site

                </a>

            </div>

        `;

        return null;

    }


    const editorEmail =
        $("#editorEmail");


    if (editorEmail) {

        editorEmail.textContent =
            profile.email || "";

    }


    return profile;

}


// ============================================================
// UPLOAD NOTE
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


    // Maximum 15 MB

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
        "Uploading note..."
    );


    const safeName =
        file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );


    const filePath =
        `${crypto.randomUUID()}-${safeName}`;


    // --------------------------------------------------------
    // UPLOAD FILE
    // --------------------------------------------------------

    const uploadResult =
        await sb.storage
            .from("notes")
            .upload(
                filePath,
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
    // GET PUBLIC URL
    // --------------------------------------------------------

    const publicURL =
        sb.storage
            .from("notes")
            .getPublicUrl(
                filePath
            )
            .data
            .publicUrl;


    // --------------------------------------------------------
    // SAVE NOTE
    // --------------------------------------------------------

    const {
        error
    } =
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
                    filePath,

                created_by:
                    profile.id

            });


    if (error) {

        // Remove uploaded file if
        // database insertion failed.

        await sb.storage
            .from("notes")
            .remove([
                filePath
            ]);


        showMessage(
            "#uploadMsg",
            error.message,
            "error"
        );

        return;

    }


    showMessage(
        "#uploadMsg",
        "Note uploaded successfully!",
        "success"
    );


    $("#uploadForm").reset();


    loadAdminNotes();

}


// ============================================================
// EDITOR — LIST ALL NOTES
// ============================================================

async function loadAdminNotes() {

    const table =
        $("#adminNotes");


    if (!table ||
        !sb) {

        return;

    }


    const {
        data,
        error
    } =
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

                    ${escapeHTML(
                        error.message
                    )}

                </td>

            </tr>

        `;

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="5">

                    No notes have been uploaded yet.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        data
            .map(note => `

                <tr>

                    <td>

                        ${escapeHTML(
                            note.title
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            note.subject
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            note.chapter ||
                            ""
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
                            type="button"
                            onclick="deleteNote(
                                '${note.id}',
                                '${escapeHTML(
                                    note.file_path ||
                                    ""
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
            "Are you sure you want to permanently delete this note?"
        )
    ) {

        return;

    }


    if (!sb) return;


    // --------------------------------------------------------
    // DELETE DATABASE RECORD
    // --------------------------------------------------------

    const {
        error
    } =
        await sb
            .from("notes")
            .delete()
            .eq(
                "id",
                noteID
            );


    if (error) {

        alert(
            "Could not delete the note:\n\n" +
            error.message
        );

        return;

    }


    // --------------------------------------------------------
    // DELETE ACTUAL FILE
    // --------------------------------------------------------

    if (filePath) {

        const {
            error: storageError
        } =
            await sb.storage
                .from("notes")
                .remove([
                    filePath
                ]);


        if (storageError) {

            console.error(
                "Storage deletion error:",
                storageError
            );

        }

    }


    // Refresh editor list

    await loadAdminNotes();

}


// ============================================================
// INITIALISE EVERYTHING
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {


        // ----------------------------------------------------
        // LOGIN PAGE
        // ----------------------------------------------------

        if ($("#loginForm")) {

            $("#loginForm")
                .addEventListener(
                    "submit",
                    login
                );

        }


        // ----------------------------------------------------
        // SIGNUP PAGE
        // ----------------------------------------------------

        if ($("#signupForm")) {

            $("#signupForm")
                .addEventListener(
                    "submit",
                    signup
                );

        }


        // ----------------------------------------------------
        // LOGOUT
        // ----------------------------------------------------

        if ($("#logout")) {

            $("#logout")
                .addEventListener(
                    "click",
                    logout
                );

        }


        // ----------------------------------------------------
        // EDITOR UPLOAD
        // ----------------------------------------------------

        if ($("#uploadForm")) {

            $("#uploadForm")
                .addEventListener(
                    "submit",
                    uploadNote
                );

        }


        // ----------------------------------------------------
        // SUBJECTS
        // ----------------------------------------------------

        if ($("#subjectGrid")) {

            showSubjects();

        }


        // ----------------------------------------------------
        // SUBJECT SEARCH
        // ----------------------------------------------------

        if ($("#subjectSearch")) {

            $("#subjectSearch")
                .addEventListener(
                    "input",
                    searchSubjectNotes
                );

        }


        // ----------------------------------------------------
        // BACK TO SUBJECTS
        // ----------------------------------------------------

        if ($("#backToSubjects")) {

            $("#backToSubjects")
                .addEventListener(
                    "click",
                    backToSubjects
                );

        }


        // ----------------------------------------------------
        // EDITOR DASHBOARD
        // ----------------------------------------------------

        if ($("#dashboard")) {

            const profile =
                await protectDashboard();


            if (profile) {

                await loadAdminNotes();

            }

        }

    }
);
