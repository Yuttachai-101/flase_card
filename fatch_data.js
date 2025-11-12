/**
 * ฟังก์ชันสำหรับดึงข้อมูล Google Sheet ที่เผยแพร่เป็น CSV
 * และแปลงเป็น JSON (Array of Objects)
 * @param {string} sheetUrl - URL ที่ได้จากการ Publish to the web (output=csv)
 */
async function fetchGoogleSheetAsJSON(sheetUrl) {
  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // ดึงข้อมูล Text (CSV)
    const csvText = await response.text();

    // แปลง CSV เป็น JSON
    const data = csvToJSON(csvText);

    // console.log("ข้อมูลที่แปลงเป็น JSON แล้ว:", data);

    //   const flashcardData = [
    //     {
    //       question: "What is the capital of Japan?",
    //       answer: "Tokyo",
    //       marked: false,
    //     },
    //     {
    //       question: "What is the chemical symbol for water?",
    //       answer: "H₂O",
    //       marked: false,
    //     },
    //     {
    //       question: "Who wrote 'To Kill a Mockingbird'?",
    //       answer: "Harper Lee",
    //       marked: true,
    //     },
    //     {
    //       question: "What planet is known as the Red Planet?",
    //       answer: "Mars",
    //       marked: false,
    //     },
    //     {
    //       question: "What is the provided text?",
    //       answer: "knowlage",
    //       marked: false,
    //     },
    //   ];

    return data;
  } catch (error) {
    console.error("Error fetching Google Sheet:", error);
  }
}

/**
 * ฟังก์ชันตัวช่วย (Helper Function) สำหรับแปลงข้อความ CSV
 * ให้เป็น Array of Objects (JSON)
 * @param {string} csvText - ข้อความดิบจากไฟล์ .csv
 */
function csvToJSON(csvText) {
  // แยกบรรทัด
  const lines = csvText.trim().split("\n");

  // ดึง Header (บรรทัดแรก) มาใช้เป็น key ของ object
  const headers = lines[0].split(",");

  const result = [];

  // วนลูปตั้งแต่บรรทัดที่ 2 (ข้อมูลจริง)
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentLine = lines[i].split(",");

    // จับคู่ข้อมูลในแถวกับ Header
    for (let j = 0; j < headers.length; j++) {
      // .trim() เพื่อลบช่องว่างหรืออักขระพิเศษที่อาจติดมา
      obj[headers[j].trim()] = currentLine[j].trim();
    }

    result.push(obj);
  }

  return result;
}

const mySheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9fjAuTBUmQvenJJoDEqXz6TqCF_WbmzZueFL9kfTTRhoFSLqrZ9LHziJPNCSw-K8gCb8DjNdtSots/pub?gid=0&single=true&output=csv";
console.log("กำลังโหลด...");

// เราสามารถ await ที่ "ระดับบนสุด" ได้เลย!
const flashcardData = await fetchGoogleSheetAsJSON(mySheetUrl);

console.log("โหลดเสร็จแล้ว:", flashcardData);

let currentIndex = 0;
let isAnimating = false;

const flashcardWrapper = document.querySelector(".flashcard-wrapper");
const flashcardInner = document.getElementById("flashcard-inner");
const questionText = document.getElementById("question-text");
const answerText = document.getElementById("answer-text");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progressText = document.getElementById("progress-text");
const markBtn = document.getElementById("mark-btn");
const starIcon = document.getElementById("star-icon");

function updateCardContent(index, direction) {
  if (isAnimating) return;
  isAnimating = true;

  const card = flashcardData[index];

  // Reset flip state
  flashcardWrapper.classList.remove("is-flipped");

  // Animation
  const animationClass =
    direction === "next" ? "animate-slide-in-right" : "animate-slide-in-left";
  flashcardInner.classList.remove(
    "animate-slide-in-right",
    "animate-slide-in-left"
  );
  // Use a timeout to allow the class removal to register before adding the new one
  setTimeout(() => {
    flashcardInner.classList.add(animationClass);
  }, 0);

  // Update content after a short delay for the old card to start animating out (conceptually)
  setTimeout(() => {
    questionText.textContent = card.question;
    answerText.textContent = card.answer;
    updateMarkStatus();
    updateProgress();
  }, 150); // Half of animation duration

  flashcardInner.addEventListener(
    "animationend",
    () => {
      isAnimating = false;
      flashcardInner.classList.remove(animationClass);
    },
    { once: true }
  );
}

function updateProgress() {
  progressText.textContent = `Card ${currentIndex + 1} of ${
    flashcardData.length
  }`;
}

function updateMarkStatus() {
  if (flashcardData[currentIndex].marked) {
    starIcon.classList.add("fill-marked", "stroke-marked");
    starIcon.classList.remove("fill-unmarked", "stroke-unmarked");
  } else {
    starIcon.classList.remove("fill-marked", "stroke-marked");
    starIcon.classList.add("fill-unmarked", "stroke-unmarked");
  }
}

function flipCard() {
  flashcardWrapper.classList.toggle("is-flipped");
}

function showNextCard() {
  currentIndex = (currentIndex + 1) % flashcardData.length;
  updateCardContent(currentIndex, "next");
}

function showPrevCard() {
  currentIndex =
    (currentIndex - 1 + flashcardData.length) % flashcardData.length;
  updateCardContent(currentIndex, "prev");
}

function toggleMark() {
  flashcardData[currentIndex].marked = !flashcardData[currentIndex].marked;
  updateMarkStatus();
}

// Event Listeners
flashcardWrapper.addEventListener("click", flipCard);
nextBtn.addEventListener("click", showNextCard);
prevBtn.addEventListener("click", showPrevCard);

markBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevent card from flipping when marking
  toggleMark();
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    showNextCard();
  } else if (e.key === "ArrowLeft") {
    showPrevCard();
  } else if (e.key === " ") {
    e.preventDefault(); // Prevent page scroll
    flipCard();
  }
});

// Initial Load
// We don't want an animation on the first load
const initialCard = flashcardData[currentIndex];
questionText.textContent = initialCard.question;
answerText.textContent = initialCard.answer;
updateMarkStatus();
updateProgress();
