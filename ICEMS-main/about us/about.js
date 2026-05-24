document.addEventListener("DOMContentLoaded", () => {

    // Ensure body starts visible
    document.body.style.opacity = "1";

    /* ========== HOME BUTTON ========== */
    const homeBtn = document.querySelector(".btn-home");
    if (homeBtn) {
        homeBtn.addEventListener("click", function(e) {
            e.preventDefault();
            document.body.style.transition = "opacity 0.6s ease-out";
            document.body.style.opacity = "0";

            setTimeout(() => {
                window.location.href = "../user/studentlogin.html"; // fixed path
            }, 600);
        });
    }

    /* ========== UNIVERSAL MODAL FUNCTION ========== */
    function openModal(title, content) {
        const existing = document.querySelector(".modal-overlay");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.className = "modal-overlay";

        modal.innerHTML = `
            <div class="modal-box">
                <button class="modal-close">&times;</button>
                <h2>${title}</h2>
                <div class="modal-body">${content}</div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = "hidden"; // prevent scrolling

        modal.querySelector(".modal-close").addEventListener("click", () => closeModal(modal));
        modal.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal-overlay")) closeModal(modal);
        });

        function closeModal(modalEl) {
            modalEl.remove();
            document.body.style.overflow = "auto";
        }
    }

    /* ========== CONTACT MODAL ========== */
    document.querySelector(".btn-contact")?.addEventListener("click", () => {
        openModal("📩 Contact Us",
            `<p><strong>Email:</strong> icems.pupsmb@gmail.com</p>
             <p><strong>Phone:</strong> 0999-123-4567</p>
             <p><strong>Facebook:</strong> facebook.com/icems.pupsmb</p>`
        );
    });

    /* ========== TEAM MODAL ========== */
    document.querySelector(".btn-team")?.addEventListener("click", () => {
        openModal("👥 Development Team",
            `<p><strong>Samantha Santos</strong> — Project Manager</p>
             <p><strong>Jhencee Borjal</strong> — Backend Developer</p>
             <p><strong>Rochelle Sto. Domingo</strong> — Frontend Developer</p>
             <p><strong>Michaela Estinor</strong> — UI/UX Designer</p>
             <p><strong>Grace Ann Lucero</strong> — QA Tester</p>`
        );
    });

    /* ========== CLOSE HEADER BUTTON ========== */
    document.querySelector(".btn-close-header")?.addEventListener("click", () => {
        document.body.style.transition = "opacity 0.6s ease-out";
        document.body.style.opacity = "0";

        setTimeout(() => {
            if (document.referrer) {
                window.location.href = document.referrer;
            } else {
                window.location.href = "../user/studentdashboard.html"; // fixed path
            }
        }, 600);
    });

    const viewBtn = document.querySelector(".btn-view");
    const mainContent = document.querySelector(".main-content");
    const body = document.body;

    // Initially hide main content and prevent scrolling
    mainContent.classList.remove("active");
    body.style.overflow = "hidden";

    viewBtn?.addEventListener("click", () => {
        // Show main content
        mainContent.classList.add("active");

        // Enable scrolling
        body.style.overflow = "auto";

        // Hide the View Details button
        viewBtn.style.display = "none";

        // Optional: scroll smoothly to main content
        window.scrollTo({ top: mainContent.offsetTop, behavior: "smooth" });
    });
});