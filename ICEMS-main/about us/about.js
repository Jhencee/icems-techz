document.addEventListener("DOMContentLoaded", () => {

    // ─── LOADER ───
    setTimeout(() => {
        document.getElementById("loader").classList.add("hide");
    }, 1400);

    // ─── NAV SCROLL ───
    const navbar = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 20);
    });

    // ─── HOME BUTTON ───
    document.getElementById("homeBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        document.body.style.transition = "opacity 0.5s ease";
        document.body.style.opacity = "0";
        setTimeout(() => { window.location.href = "../user/studentlogin.html"; }, 500);
    });

    // ─── MODAL HELPER ───
    function openModal(title, items) {
        document.querySelector(".modal-overlay")?.remove();
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
            <div class="modal-box">
                <button class="modal-close">&times;</button>
                <h2>${title}</h2>
                ${items.map(i => `<div class="modal-item">${i}</div>`).join("")}
            </div>`;
        document.body.appendChild(overlay);

        const close = () => {
            overlay.remove();
            document.body.style.overflow = "";
        };
        overlay.querySelector(".modal-close").addEventListener("click", close);
        overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    }

    // ─── CONTACT MODAL ───
    document.getElementById("contactBtn")?.addEventListener("click", () => {
        openModal("Contact Us", [
            "<strong>Email:</strong> icems.pupsmb@gmail.com",
            "<strong>Phone:</strong> 0999-123-4567",
            "<strong>Facebook:</strong> facebook.com/icems.pupsmb"
        ]);
    });

    // ─── TEAM MODAL ───
    document.getElementById("teamBtn")?.addEventListener("click", () => {
        openModal("Development Team", [
            "<strong>Samantha Santos</strong> — Project Manager",
            "<strong>Jhencee Borjal</strong> — Backend Developer",
            "<strong>Rochelle Sto. Domingo</strong> — Frontend Developer",
            "<strong>Michaela Estinor</strong> — UI/UX Designer",
            "<strong>Julianna Alejandria</strong> — QA",
            "<strong>Amytha Bautista</strong> — Tester"
        ]);
    });

    // ─── REVEAL MAIN CONTENT ───
    function revealMain() {
        const main = document.getElementById("mainContent");
        main.style.display = "block";
        requestAnimationFrame(() => {
            main.style.opacity = "1";
            document.body.style.overflowY = "auto";
            setTimeout(() => {
                main.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });
        document.getElementById("viewBtn").style.display = "none";
        document.getElementById("heroExplore").style.display = "none";
    }

    document.getElementById("viewBtn")?.addEventListener("click", revealMain);
    document.getElementById("heroExplore")?.addEventListener("click", revealMain);

    // ─── SCROLL REVEAL ───
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.style.transitionDelay = `${e.target.dataset.delay || 0}ms`;
                e.target.classList.add("visible");
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".reveal").forEach((el, i) => {
        el.dataset.delay = i * 80;
        observer.observe(el);
    });

    // ─── PREVENT SCROLL INITIALLY ───
    document.body.style.overflowY = "hidden";
});