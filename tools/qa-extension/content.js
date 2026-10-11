/**
 * EnrollPro QA Autofill Content Script
 * Injected into the active tab to autofill React-based forms.
 */

(() => {
  if (window.__ENROLLPRO_QA_EXT_INJECTED__) {
    return;
  }
  window.__ENROLLPRO_QA_EXT_INJECTED__ = true;

  const phFirstNamesMale = ["Juan Miguel", "Jose", "Pedro", "Carlo", "Mark", "Angelo", "Paolo", "Luis"];
  const phFirstNamesFemale = ["Maria", "Ana", "Luz", "Teresa", "Sofia", "Isabella", "Bianca", "Camille"];
  const phLastNames = ["Dela Cruz", "Santos", "Reyes", "Aquino", "Garcia", "Mendoza", "Ramos", "Bautista"];
  const phCities = ["Bacolod City", "Talisay City", "Silay City", "Bago City", "Kabankalan City"];

  function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomDigits(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  }

  async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function generateMockData() {
    const isMale = Math.random() > 0.5;
    const firstName = isMale ? randomChoice(phFirstNamesMale) : randomChoice(phFirstNamesFemale);
    const lastName = randomChoice(phLastNames);
    const middleName = randomChoice(phLastNames);
    const motherFirstName = randomChoice(phFirstNamesFemale);
    const fatherFirstName = randomChoice(phFirstNamesMale);

    const lrn = "1" + randomDigits(11);
    const contactNumber = "09" + randomDigits(9);
    const generalAverage = (82 + Math.random() * 16).toFixed(2);

    return {
      studentPhoto: "https://ui-avatars.com/api/?name=" + encodeURIComponent(firstName),
      hasNoLrn: false,
      lrn: lrn,
      psaBirthCertNumber: "PSA-" + randomDigits(10),
      
      lastName: lastName,
      firstName: firstName,
      middleName: middleName,
      extensionName: "", 
      birthdate: "05/15/2012",
      sex: isMale ? "MALE" : "FEMALE",
      placeOfBirth: randomChoice(phCities) + ", NEGROS OCCIDENTAL",
      religion: "Catholic",

      isIpCommunity: false,
      ipGroupName: "Ati",
      is4PsBeneficiary: false,
      householdId4Ps: "4PS-" + randomDigits(6),
      
      intakeHeightCm: 150 + Math.floor(Math.random() * 20),
      intakeWeightKg: 45 + Math.floor(Math.random() * 15),

      isBalikAral: false,
      lastYearEnrolled: "2021-2022",
      
      isLearnerWithDisability: false,
      specialNeedsCategory: "a1",
      hasPwdId: false,
      "disabilityTypes.0": "Visual Impairment",
      disabilityTypes: ["Visual Impairment"],

      "currentAddress.houseNo": randomDigits(3) + " " + randomChoice(["Rizal St.", "Mabini St.", "Quezon St.", "Bonifacio St."]),
      "currentAddress.street": "Purok " + Math.floor(Math.random() * 10 + 1),
      "currentAddress.sitio": "SITIO CALAMBUGA",
      "currentAddress.houseNoStreet": "123 RIZAL STREET",
      addressSitio: "SITIO CALAMBUGA",
      addressStreet: "123 RIZAL STREET",
      isPermanentSameAsCurrent: true,

      "mother.lastName": lastName,
      "mother.firstName": motherFirstName,
      "mother.middleName": randomChoice(phLastNames),
      "mother.contactNumber": contactNumber,
      "mother.email": motherFirstName.toLowerCase() + "@example.com",
      "mother.occupation": "Teacher",

      "father.lastName": lastName,
      "father.firstName": fatherFirstName,
      "father.middleName": randomChoice(phLastNames),
      "father.contactNumber": "09" + randomDigits(9),
      "father.email": fatherFirstName.toLowerCase() + "@example.com",
      "father.occupation": "Engineer",

      guardianFirstName: motherFirstName,
      guardianMiddleName: randomChoice(phLastNames),
      guardianLastName: lastName,
      guardianContact: contactNumber,
      guardianRelationship: "MOTHER",

      "guardian.lastName": lastName,
      "guardian.firstName": motherFirstName,
      "guardian.middleName": randomChoice(phLastNames),
      "guardian.contactNumber": contactNumber,
      "guardian.email": motherFirstName.toLowerCase() + "@example.com",
      "guardian.occupation": "Teacher",
      "guardian.relationship": "Mother",

      primaryContact: "MOTHER",
      contactNumber: contactNumber,

      previousSchoolName: "HINIGARAN ELEMENTARY SCHOOL-B",
      originatingSchoolId: "117114",
      lastSchoolName: "HINIGARAN ELEMENTARY SCHOOL-B",
      lastSchoolId: "117114",
      lastGradeCompleted: "6",
      schoolYearLastAttended: "2023-2024",
      lastSchoolAddress: "Rizal St, Hinigaran, Negros Occidental",
      transferCertificateNo: "TC-" + randomDigits(5),
      lastSchoolType: "PUBLIC",
      previousGenAve: generalAverage,
      grade5GeneralAverage: generalAverage,
      generalAverage: generalAverage,
      sf9EligibilityStatus: "PROMOTED",
      underSpecialScienceCurriculum: true,

      isScpApplication: true,
      scpType: "SCIENCE_TECHNOLOGY_AND_ENGINEERING", 
      artField: "Visual Arts",
      chosenSport: "VOLLEYBALL",
      "sportsList.0": "Basketball",
      sportsList: ["Basketball"],
      foreignLanguage: "Spanish",

      gradeLevel: "7",
      learnerType: "NEW_ENROLLEE",
      "learningModalities.0": "BLENDED",
      learningModalities: ["BLENDED"],

      isPrivacyConsentGiven: true,
      hasExecutedAffidavit: true,
      bypassDuplicate: false
    };
  }

  /**
   * Bypasses React's virtual DOM to set a value on a native input element.
   */
  function setReactInputValue(element, value) {
    if (!element) return;
    
    const isCheckboxOrRadio = element.type === 'checkbox' || element.type === 'radio';
    const propertyName = isCheckboxOrRadio ? 'checked' : 'value';

    let prototype = Object.getPrototypeOf(element);
    if (element instanceof HTMLInputElement) prototype = window.HTMLInputElement.prototype;
    else if (element instanceof HTMLTextAreaElement) prototype = window.HTMLTextAreaElement.prototype;
    else if (element instanceof HTMLSelectElement) prototype = window.HTMLSelectElement.prototype;
    else if (element instanceof HTMLButtonElement) prototype = window.HTMLButtonElement.prototype;

    const setter = Object.getOwnPropertyDescriptor(prototype, propertyName)?.set;
    
    if (setter) {
      setter.call(element, value);
    } else {
      element[propertyName] = value;
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Sets a real 1x1 transparent PNG file on a file input and dispatches change event.
   */
  function setFileInputPhoto(fileInput) {
    if (!fileInput) return;
    try {
      const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const byteCharacters = atob(pngBase64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: "image/png" });
      const file = new File([blob], "student_photo.png", { type: "image/png" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      console.warn("Could not set file input photo", e);
    }
  }

  function fillField(name, value) {
    let el = document.querySelector(`input[name="${name}"], select[name="${name}"], textarea[name="${name}"]`);
    if (!el) {
      try {
        el = document.getElementById(name);
      } catch {
        // ignore selector error
      }
    }
    if (!el && name.includes('.')) {
      const escaped = name.replace(/\./g, '\\.');
      el = document.querySelector(`#${escaped}, [name="${name}"]`);
    }

    if (el) {
      if (el.tagName.toLowerCase() === 'select') {
        const options = Array.from(el.querySelectorAll('option'));
        const validOptions = options.filter(opt => !opt.disabled && opt.value && opt.value.trim() !== "");
        if (validOptions.length > 0) {
          const match = validOptions.find(opt => opt.value.toUpperCase() === String(value).toUpperCase() || opt.textContent.toUpperCase().includes(String(value).toUpperCase()));
          setReactInputValue(el, match ? match.value : validOptions[0].value);
          return;
        }
      }
      if (el.type === 'checkbox' || el.type === 'radio') {
        setReactInputValue(el, value === true || value === "true");
      } else {
        setReactInputValue(el, value);
      }
    }
  }

  /**
   * UI Automation Helper for Shadcn / Radix Comboboxes & Selects
   */
  async function fillRadixComboboxByLabel(labelText, optionText = null) {
    const normalizedSearch = String(labelText).replace(/\s+/g, ' ').replace('*', '').trim().toUpperCase();
    const labels = Array.from(document.querySelectorAll('label, [class*="FormLabel"]'));
    const targetLabel = labels.find(l => {
      const text = l.textContent.replace(/\s+/g, ' ').replace('*', '').trim().toUpperCase();
      return text === normalizedSearch || text.startsWith(normalizedSearch) || text.includes(normalizedSearch);
    });

    let button = null;
    if (targetLabel) {
      let container = targetLabel.parentElement;
      if (container) {
        button = container.querySelector('button[role="combobox"]');
        if (!button && container.parentElement) {
          button = container.parentElement.querySelector('button[role="combobox"]');
        }
      }
    }

    if (!button) {
      const allButtons = Array.from(document.querySelectorAll('button[role="combobox"]'));
      button = allButtons.find(b => {
        const text = (b.getAttribute('aria-label') || b.textContent || '').toUpperCase();
        return text.includes(normalizedSearch);
      });
    }

    if (!button) return false;

    if (button.disabled) {
      await wait(800);
      if (button.disabled) return false;
    }

    button.click();
    await wait(400);

    const popovers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [data-radix-select-content], [role="listbox"]'));
    const activePopover = popovers.find(p => p.style.display !== 'none' && !p.hasAttribute('hidden'));
    
    if (!activePopover) {
      button.click();
      return false;
    }

    const options = Array.from(activePopover.querySelectorAll('li > button, [role="option"], [data-radix-collection-item]'));
    const valid = options.filter(o => {
       const t = o.textContent.trim().toUpperCase();
       return t.length > 0 && !t.includes('NO RESULTS') && !t.includes('SELECT') && !t.includes('LOADING') && !o.disabled && !o.hasAttribute('data-disabled');
    });

    if (valid.length > 0) {
      if (optionText === "FIRST") {
        valid[0].click();
      } else if (optionText) {
        const match = valid.find(o => o.textContent.toUpperCase().includes(optionText.toUpperCase()));
        if (match) {
          match.click();
        } else {
          valid[0].click();
        }
      } else {
        valid[0].click();
      }
      await wait(200);
      return true;
    }

    button.click();
    return false;
  }

  /**
   * UI Automation Helper for Radix Select
   */
  async function fillRadixSelectByLabel(labelText, optionText = null) {
    const normalizedSearch = String(labelText).replace(/\s+/g, ' ').replace('*', '').trim().toUpperCase();
    const labels = Array.from(document.querySelectorAll('label, [class*="FormLabel"]'));
    const targetLabel = labels.find(l => {
      const text = l.textContent.replace(/\s+/g, ' ').replace('*', '').trim().toUpperCase();
      return text === normalizedSearch || text.startsWith(normalizedSearch) || text.includes(normalizedSearch);
    });

    let button = null;
    if (targetLabel) {
      let container = targetLabel.parentElement;
      if (container) {
        button = container.querySelector('button[role="combobox"], button[data-state]');
        if (!button && container.parentElement) {
          button = container.parentElement.querySelector('button[role="combobox"], button[data-state]');
        }
      }
    }

    if (!button) {
      const allButtons = Array.from(document.querySelectorAll('button[role="combobox"]'));
      button = allButtons.find(b => {
        const parent = b.closest('[class*="FormItem"]') || b.parentElement;
        return parent && parent.textContent.toUpperCase().includes(normalizedSearch);
      });
    }

    if (!button) return false;
    if (button.disabled) return false;

    button.click();
    await wait(350);

    const popovers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [data-radix-select-content], [role="listbox"]'));
    const activePopover = popovers.find(p => p.style.display !== 'none' && !p.hasAttribute('hidden'));

    if (!activePopover) {
      button.click();
      return false;
    }

    const options = Array.from(activePopover.querySelectorAll('[role="option"], li > button, [data-radix-collection-item]'));
    const valid = options.filter(o => {
      const t = o.textContent.trim().toUpperCase();
      return t.length > 0 && !t.includes('NO RESULTS') && !t.includes('SELECT') && !t.includes('LOADING') && !o.disabled && !o.hasAttribute('data-disabled');
    });

    if (valid.length > 0) {
      if (optionText === "FIRST") {
        valid[0].click();
      } else if (optionText) {
        const match = valid.find(o => {
          const t = o.textContent.trim().toUpperCase();
          const target = String(optionText).trim().toUpperCase();
          return t === target || t.includes(target);
        });
        if (match) {
          match.click();
        } else {
          valid[0].click();
        }
      } else {
        valid[0].click();
      }
      await wait(200);
      return true;
    }

    button.click();
    return false;
  }

  /**
   * Automates button groups (like Sex buttons, Yes/No buttons, Grade Level buttons)
   */
  async function fillButtonGroupByLabel(labelText, optionText) {
    const normalizedSearch = String(labelText).replace(/\s+/g, ' ').replace('*', '').trim().toUpperCase();
    const labels = Array.from(document.querySelectorAll('label, [class*="FormLabel"]'));
    const targetLabel = labels.find(l => {
      const text = l.textContent.replace(/\s+/g, ' ').replace('*', '').trim().toUpperCase();
      return text === normalizedSearch || text.includes(normalizedSearch);
    });

    if (!targetLabel) return false;

    let container = targetLabel.parentElement;
    if (!container) return false;

    let buttons = Array.from(container.querySelectorAll('button:not([role="combobox"])'));
    if (buttons.length === 0 && container.parentElement) {
      container = container.parentElement;
      buttons = Array.from(container.querySelectorAll('button:not([role="combobox"])'));
    }
    
    if (buttons.length === 0) return false;

    const targetButton = buttons.find(b => {
      const text = b.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
      return text === String(optionText).trim().toUpperCase() || text.includes(String(optionText).trim().toUpperCase());
    });

    if (targetButton) {
      targetButton.click();
      await wait(100);
      return true;
    } else if (optionText === "FIRST" && buttons.length > 0) {
      buttons[0].click();
      await wait(100);
      return true;
    }
    return false;
  }

  async function fillAllFields(data) {
    // 1. Fill standard inputs
    for (const [key, value] of Object.entries(data)) {
      fillField(key, value);
    }

    // 2. Automate custom React Comboboxes (Shadcn/Radix)
    await fillRadixComboboxByLabel("Mother Tongue", "Tagalog");
    await fillRadixComboboxByLabel("Suffix (Extension)", "None");

    // Address Selector (Ordered: Region -> Province -> City -> Barangay)
    await fillRadixComboboxByLabel("Region", "NEGROS ISLAND REGION");
    await wait(500);
    await fillRadixComboboxByLabel("Province", "NEGROS OCCIDENTAL");
    await wait(500);
    await fillRadixComboboxByLabel("City / Municipality", "HINIGARAN");
    await wait(500);
    await fillRadixComboboxByLabel("Barangay", "FIRST");

    // Previous School
    await fillRadixComboboxByLabel("School Year Last Attended", "FIRST");

    // 3. Automate Button Groups
    await fillButtonGroupByLabel("Is the learner a member of an IP cultural community?", data.isIpCommunity ? "YES" : "NO");
    await fillButtonGroupByLabel("Does the learner's household currently receive benefits under the Pantawid Pamilyang Pilipino Program (4Ps)?", data.is4PsBeneficiary ? "YES" : "NO");
    await fillButtonGroupByLabel("Is the learner under the Special Needs Education Program?", data.isLearnerWithDisability ? "YES" : "NO");
    await fillButtonGroupByLabel("Is this learner returning to school after a gap of 1 year or more? (Balik-Aral)", data.isBalikAral ? "YES" : "NO");

    const modalitiesDiv = document.getElementById("learningModalities");
    if (modalitiesDiv) {
      const buttons = modalitiesDiv.querySelectorAll("button[role='checkbox']");
      if (buttons.length > 0) {
        buttons[0].click();
      }
    }

    await fillButtonGroupByLabel("Sex", data.sex);
    if (data.underSpecialScienceCurriculum !== undefined) {
      await fillButtonGroupByLabel("Under Special Science Curriculum", data.underSpecialScienceCurriculum ? "YES" : "NO");
    }
  }

  /**
   * Autofills all fields and buttons in WalkInEncodePanel.tsx
   */
  async function fillWalkInEnrollment() {
    // 1. Ensure modal/dialog is open
    let isPanelOpen = Boolean(
      document.querySelector('form button[type="submit"]') &&
      document.body.textContent.includes("Walk-In Learner Enrollment")
    );

    if (!isPanelOpen) {
      const openButtons = Array.from(document.querySelectorAll('button'));
      const triggerBtn = openButtons.find(b => {
        const text = b.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
        return text.includes("ENCODE WALK-IN") || text.includes("ENCODE WALK IN");
      });
      if (triggerBtn) {
        triggerBtn.click();
        await wait(500);
      }
    }

    const data = generateMockData();

    // 2. Select Learner Type (default: New Entrant)
    const learnerTypeButtons = Array.from(document.querySelectorAll('button'));
    const newEntrantBtn = learnerTypeButtons.find(b => b.textContent.trim().toUpperCase() === "NEW ENTRANT");
    if (newEntrantBtn) {
      newEntrantBtn.click();
      await wait(150);
    }

    // 3. Handle LRN (fill 12 digits, wait for lookup debounce)
    const noLrnCheckbox = document.getElementById("noLrn");
    if (noLrnCheckbox && noLrnCheckbox.getAttribute('data-state') === 'checked') {
      noLrnCheckbox.click();
      await wait(150);
    }

    const lrnInput = document.querySelector('input[name="lrn"], input[placeholder*="Learner Reference Number"]');
    if (lrnInput) {
      lrnInput.focus();
      setReactInputValue(lrnInput, data.lrn);
      lrnInput.blur();
      // Wait for lookup network check to finish (so 404 reset runs before we fill other fields)
      await wait(600);
    }

    // If a learner found modal popped up, handle it
    const modalProceedBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.trim().toUpperCase() === "PROCEED");
    if (modalProceedBtn) {
      modalProceedBtn.click();
      await wait(300);
    }

    // 4. Upload photo
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
    const photoInput = fileInputs.find(i => (i.accept || '').includes('image'));
    if (photoInput) {
      setFileInputPhoto(photoInput);
      await wait(200);
    }

    // 5. Fill Names
    fillField("lastName", data.lastName);
    fillField("firstName", data.firstName);
    fillField("middleName", data.middleName);
    await fillRadixSelectByLabel("Suffix (Extension)", "None");

    // 6. Birthdate (HybridDatePicker MM/DD/YYYY)
    const birthdateInput = document.querySelector('input[placeholder="MM/DD/YYYY"], input[name="birthdate"]');
    if (birthdateInput) {
      birthdateInput.focus();
      setReactInputValue(birthdateInput, "05/15/2012");
      birthdateInput.blur();
      await wait(150);
    }

    // 7. Sex Button
    await fillButtonGroupByLabel("Sex", "Male");

    // 8. Mother Tongue
    await fillRadixComboboxByLabel("Mother Tongue", "Tagalog");
    await wait(200);

    // 9. Incoming Grade Level (Click Grade 7)
    await fillButtonGroupByLabel("Incoming Grade Level", "Grade 7");
    await wait(200);

    // 10. Curriculum Type (Click BEC / Regular)
    await fillButtonGroupByLabel("Curriculum Type", "BEC");
    await wait(200);

    // 11. Learning Modality Checkbox
    const modalityCheckbox = document.getElementById("walkin-modality-BLENDED") || document.querySelector('[id^="walkin-modality-"]');
    if (modalityCheckbox && modalityCheckbox.getAttribute('data-state') !== 'checked') {
      modalityCheckbox.click();
      await wait(150);
    }

    // 12. Background & Special Categories Buttons
    ['isIpCommunity', 'is4PsBeneficiary', 'isBalikAral', 'isLearnerWithDisability'].forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        const noBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.trim().toUpperCase() === 'NO');
        if (noBtn) noBtn.click();
      }
    });
    await wait(200);

    // 13. Current Home Address
    await fillRadixComboboxByLabel("Region", "NEGROS ISLAND REGION");
    await wait(500);
    await fillRadixComboboxByLabel("Province", "NEGROS OCCIDENTAL");
    await wait(500);
    await fillRadixComboboxByLabel("City / Municipality", "HINIGARAN");
    await wait(500);
    await fillRadixComboboxByLabel("Barangay", "FIRST");
    await wait(200);

    fillField("addressSitio", "Sitio Calambuga");
    fillField("addressStreet", "123 Rizal Street");

    // 14. Previous School Data
    fillField("previousSchoolName", "HINIGARAN ELEMENTARY SCHOOL-B");
    fillField("originatingSchoolId", "117114");
    fillField("previousGenAve", "88.50");
    await fillButtonGroupByLabel("SF9 Eligibility Status", "Promoted");
    await wait(200);

    // 15. Emergency Contact
    fillField("guardianFirstName", data.guardianFirstName);
    fillField("guardianMiddleName", data.guardianMiddleName);
    fillField("guardianLastName", data.guardianLastName);
    fillField("guardianContact", data.guardianContact);
    await fillRadixSelectByLabel("Relationship to Learner", "Mother");
    await wait(200);

    // 16. Required Documents Checkboxes
    const sf9Checkbox = document.getElementById("walkin-sf9-checkbox");
    if (sf9Checkbox && sf9Checkbox.getAttribute('data-state') !== 'checked') {
      sf9Checkbox.click();
      await wait(100);
    }

    const psaCheckbox = document.getElementById("walkin-psa-checkbox");
    if (psaCheckbox && psaCheckbox.getAttribute('data-state') !== 'checked') {
      psaCheckbox.click();
      await wait(100);
    }

    return "Walk-in Enrollment form successfully filled out!";
  }

  /**
   * Autofills all fields and buttons in ScpAdmissionForm.tsx
   */
  async function fillWalkInScpAdmission() {
    // 1. Ensure modal/dialog is open if on the dashboard
    let isFormVisible = Boolean(
      document.querySelector('form') &&
      document.body.textContent.includes("Special Curricular Program")
    );

    if (!isFormVisible) {
      const buttons = Array.from(document.querySelectorAll('button'));
      const triggerBtn = buttons.find(b => {
        const text = b.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
        return text.includes("ENCODE WALK-IN") || text.includes("ENCODE WALK IN") || text.includes("ENCODE WALK-IN APPLICANT");
      });
      if (triggerBtn) {
        triggerBtn.click();
        await wait(500);
      }
    }

    const data = generateMockData();

    // 2. Select Special Curricular Program (if enabled)
    await fillRadixSelectByLabel("Select Special Curricular Program", "Science, Technology, and Engineering");
    await wait(200);

    // 3. Fill LRN (Section II)
    const lrnInput = document.querySelector('input[name="lrn"], input[placeholder*="12-DIGIT LRN"]');
    if (lrnInput) {
      lrnInput.focus();
      setReactInputValue(lrnInput, data.lrn);
      lrnInput.blur();
      await wait(400);
    }

    // 4. Upload photo
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
    const photoInput = fileInputs.find(i => (i.accept || '').includes('image'));
    if (photoInput) {
      setFileInputPhoto(photoInput);
      await wait(200);
    }

    // 5. Fill Personal Information
    fillField("lastName", data.lastName);
    fillField("firstName", data.firstName);
    fillField("middleName", data.middleName);
    await fillRadixSelectByLabel("Suffix (Extension)", "None");

    // 6. Birthdate
    const birthdateInput = document.getElementById("birthdate") || document.querySelector('input[name="birthdate"]');
    if (birthdateInput) {
      birthdateInput.focus();
      setReactInputValue(birthdateInput, "05/15/2012");
      birthdateInput.blur();
      await wait(150);
    }

    // 7. Sex Button
    await fillButtonGroupByLabel("Sex", "MALE");

    // 8. Place of Birth & Mother Tongue
    fillField("placeOfBirth", "BACOLOD CITY, NEGROS OCCIDENTAL");
    await fillRadixComboboxByLabel("Mother Tongue", "Tagalog");
    await wait(200);

    // 9. Current Home Address
    await fillRadixComboboxByLabel("Region", "NEGROS ISLAND REGION");
    await wait(500);
    await fillRadixComboboxByLabel("Province", "NEGROS OCCIDENTAL");
    await wait(500);
    await fillRadixComboboxByLabel("City / Municipality", "HINIGARAN");
    await wait(500);
    await fillRadixComboboxByLabel("Barangay", "FIRST");
    await wait(200);

    fillField("currentAddress.sitio", "SITIO CALAMBUGA");
    fillField("currentAddress.houseNoStreet", "123 RIZAL STREET");

    // 10. Previous School Information (Section III)
    fillField("lastSchoolName", "APOLINARIO MABINI ELEMENTARY SCHOOL");
    fillField("lastSchoolId", "117114");
    fillField("lastSchoolAddress", "BACOLOD CITY, NEGROS OCCIDENTAL");
    await fillButtonGroupByLabel("School Type", "Public");
    await wait(200);

    // 11. Academic Profile & Qualifications (Section IV)
    fillField("grade5GeneralAverage", "90.00");
    await fillButtonGroupByLabel("Under Special Science Curriculum", "Yes");
    fillField("chosenSport", "VOLLEYBALL");
    await fillRadixSelectByLabel("Arts Specialization", "Media");
    await wait(200);

    // 12. Accuracy Certification Checkbox
    const certifyCheck = document.getElementById("admission-certify-check") || document.querySelector('input[name="isPrivacyConsentGiven"]');
    if (certifyCheck) {
      if (certifyCheck.getAttribute('data-state') !== 'checked' && !certifyCheck.checked) {
        certifyCheck.click();
        await wait(150);
      }
    }

    return "Walk-in SCP Admission form successfully filled out!";
  }

  const actions = {
    FILL_WALKIN_ENROLLMENT: fillWalkInEnrollment,
    FILL_WALK_IN_ENROLLMENT: fillWalkInEnrollment,
    FILL_WALKIN_SCP: fillWalkInScpAdmission,
    FILL_WALK_IN_SCP: fillWalkInScpAdmission,
    FILL_WALKIN_SCP_ADMISSION: fillWalkInScpAdmission,

    FILL_EARLY_REGISTRATION: async () => {
      const data = generateMockData();
      await fillAllFields(data);
      return "Early Registration form dynamically filled!";
    },
    FILL_SCP_ADMISSION: async () => {
      return await fillWalkInScpAdmission();
    },
    FILL_ENROLLMENT: async () => {
      const data = generateMockData();
      await fillAllFields(data);
      return "Enrollment form dynamically filled!";
    }
  };

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action && actions[request.action]) {
      actions[request.action]()
        .then(message => sendResponse({ success: true, message }))
        .catch(err => {
          console.error(err);
          sendResponse({ success: false, message: err.message });
        });
      return true;
    }
  });
})();
