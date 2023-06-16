"use client";
// Import required libraries
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css"; // Assuming you have a CSS module at this path
import { NextPage } from "next";
import {
  addCommunityData,
  uploadImageLink,
  getImageLink,
  isInDirectoryAlready,
  deleteDataFromDirectory,
} from "../../../lib/utils/process";
import { useRouter } from "next/navigation";
import { getUserSession } from "../../../lib/utils/auth";
import DirectoryOverrideModal from "../../../components/directory-override-modal/directory-override-modal";
import loadingStyles from '../loadingOverlay.module.css'

const MyForm: NextPage = () => {
  const [roomPrice, setRoomPrice] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [housemates, setHousemates] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [link, setLink] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isModalActive, setIsModalActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const phoneRegex =
    /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  const urlRegex = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i;
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [visitedFields, setVisitedFields] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);



  const handleOptionClick = (
    setOption: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setOption((prev: string) => (prev === value ? "" : value));
  };

  const handleLinkClick = async (e: React.MouseEvent) => {
    const session = await getUserSession();
    // Create some logic that checks if an upload is already in the directory
    setIsLoading(true);
    const isDataPresentAlready = await isInDirectoryAlready(session!.userID);
    setIsLoading(false);
    if (isDataPresentAlready && isFormValid) {
      setIsModalActive(true);
    } else {
      if (!isFormValid) {
        e.preventDefault();
      } else {
        e.preventDefault();
        setIsLoading(true);
        await handleSubmit();
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    // This is the code that will be executed when the "Yes" button is clicked
    try {
      const session = await getUserSession();
      const twitterImageUrl = session?.twitterAvatarURL
      let higherResImageUrl = twitterImageUrl.replace('_normal', '_400x400');
      if (!selectedImage) {
        await addCommunityData(
          communityName,
          description,
          roomPrice,
          housemates,
          link,
          higherResImageUrl,
          contactMethod,
          session?.userID,
          session?.twitterHandle,
          phone
        );
      } else {
        await uploadImageLink(selectedImage, session!.userID);
        const imageLink = await getImageLink(session!.userID);
        if (typeof imageLink === "string") {
          await addCommunityData(
            communityName,
            description,
            roomPrice,
            housemates,
            link,
            imageLink,
            contactMethod,
            session?.userID,
            session?.twitterHandle,
            phone
          );
        }
      }
      router.push("/directory");
    } catch (error) {
      alert("You are not logged in");
      // Optionally show an error message to the user
    }
  };

  const handleDeletion = async () => {
    try {
      const session = await getUserSession();
      await deleteDataFromDirectory(session!.userID);
    } catch {
      alert("You are not logged in");
      throw new Error("Couldnt delete from directory");
    }
  };

  function handleInputChange(
    callback: (value: string) => void,
    field?: string
  ) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      let { value } = event.target;

      if (typeof field === 'undefined') {
        setFocusedField(null);  // or however you want to handle this case
      } else {
        setFocusedField(field);
      }

      // Handle phone field
      if (field === "phone") {
        // Allow only digits
        value = value.replace(/[^\d]/g, "");

        // Adding formatting
        if (value.length > 3 && value.length <= 6)
          value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        else if (value.length > 6)
          value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(
            6,
            10
          )}`;

        event.target.value = value;
      }
      // Handle URL field
      else if (field === "url" && !urlRegex.test(value)) {
        console.error("Invalid URL");
        setIsFormValid(false);
      }

      callback(value);
    };
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file =
      event.target.files && event.target.files.length > 0
        ? event.target.files[0]
        : null;

    if (!file) return;

    setSelectedImage(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  function handleBlur(field: string) {
    setVisitedFields((prev) => new Set([...prev, field]));
  }

  useEffect(() => {
    if (
      description &&
      roomPrice &&
      link &&
      housemates &&
      communityName &&
      contactMethod &&
      ((contactMethod === "phone" && phoneRegex.test(phone)) ||
        contactMethod !== "phone") &&
      urlRegex.test(link)
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [
    description,
    roomPrice,
    housemates,
    contactMethod,
    link,
    phone,
    selectedImage,
    imagePreview,
    communityName,
    isModalActive,
  ]);

  return (
    <div className={styles.container}>
      {isLoading && (
        <div className={loadingStyles.overlay}>
          <div className={loadingStyles.spinner}></div>
        </div>
      )}
      <DirectoryOverrideModal
        modalActivity={isModalActive}
        handleSubmit={handleSubmit}
        handleDeletion={handleDeletion}
        setIsModalActive={setIsModalActive}
      />
      <form className={styles.form}>
        <Link href="/directory/existing-communities">Back to directory</Link>
        <h1>Add community to the directory</h1>
        <div
          style={{ height: "1px", backgroundColor: "gray", width: "100%" }}
        />

        <div>
          <label>
            <h2>What&#39;s the name of your community?</h2>
            <p className={styles.maxCharacters}>
              If no formal name, just put Apartment or House
            </p>
            <input
              className={`${styles.inputStyle} ${visitedFields.has("communityName") && !communityName ? styles.inputError : ""}`}
              type="text"
              placeholder="Solaris"
              onChange={handleInputChange(setCommunityName, "communityName")}
              onFocus={() => setVisitedFields((prev) => new Set([...prev, "communityName"]))}
              onBlur={() => handleBlur("communityName")}
              autoFocus={true}
            />
            {visitedFields.has("communityName") && !communityName && (
              <div className={styles.errorMessage}>This field is required.</div>
            )}
          </label>
        </div>

        <div>
          <label>
            <h2>Introduce yourself and what your community is about.</h2>
            <p className={styles.maxCharacters}>
              Who is it for? How do residents create value for one another?
            </p>
            <div style={{ display: "flex", alignItems: "center" }}>
              <textarea
                className={`${styles.textareaStyle} ${visitedFields.has("description") && !description ? styles.inputError : ""}`}
                placeholder="We are a group of founders building early-stage startups and looking for people that have found something meaningful to work on. We help one another by informally making connections and giving feedback to one another on what we're working on."
                onChange={handleInputChange(setDescription, "description")}
                onFocus={() => setVisitedFields((prev) => new Set([...prev, "description"]))}
                onBlur={() => handleBlur("description")}
              />
            </div>
            {visitedFields.has("description") && !description && (
              <div className={styles.errorMessage}>This field is required.</div>
            )}
          </label>
        </div>

        <div>
          <h2>How much does the average room cost?</h2>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setRoomPrice, "less1000")}
          >
            <div
              className={`${styles.option} ${
                roomPrice === "less1000" ? styles.optionSelected : ""
              }`}
            ></div>
            &lt;$1000 / month
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setRoomPrice, "1000to1500")}
          >
            <div
              className={`${styles.option} ${
                roomPrice === "1000to1500" ? styles.optionSelected : ""
              }`}
            ></div>
            $1000 - $1500 / month
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setRoomPrice, "1500to2000")}
          >
            <div
              className={`${styles.option} ${
                roomPrice === "1500to2000" ? styles.optionSelected : ""
              }`}
            ></div>
            $1500 - $2000 / month
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setRoomPrice, "2000to2500")}
          >
            <div
              className={`${styles.option} ${
                roomPrice === "2000to2500" ? styles.optionSelected : ""
              }`}
            ></div>
            $2000 - $2500 / month
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setRoomPrice, "2500to3000")}
          >
            <div
              className={`${styles.option} ${
                roomPrice === "2500to3000" ? styles.optionSelected : ""
              }`}
            ></div>
            $2500 - $3000 / month
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setRoomPrice, "3000plus")}
          >
            <div
              className={`${styles.option} ${
                roomPrice === "3000plus" ? styles.optionSelected : ""
              }`}
            ></div>
            $3000+ / month
          </div>
        </div>

        <div>
          <h2>How many housemates do you live with?</h2>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setHousemates, "1-2")}
          >
            <div
              className={`${styles.option} ${
                housemates === "1-2" ? styles.optionSelected : ""
              }`}
            ></div>
            1-2
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setHousemates, "3-5")}
          >
            <div
              className={`${styles.option} ${
                housemates === "3-5" ? styles.optionSelected : ""
              }`}
            ></div>
            3-5
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setHousemates, "6-12")}
          >
            <div
              className={`${styles.option} ${
                housemates === "6-12" ? styles.optionSelected : ""
              }`}
            ></div>
            6-12
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setHousemates, "12+")}
          >
            <div
              className={`${styles.option} ${
                housemates === "12+" ? styles.optionSelected : ""
              }`}
            ></div>
            12+
          </div>
        </div>

        <div>
          <label>
            <h2>What&#39;s a link that best describes the community?</h2>
            <p className={styles.maxCharacters}>
              Community website or Twitter page preferred. If none, then share a
              link that represents you
            </p>
            <input
              className={`${styles.inputStyle} ${visitedFields.has("url") && (!link || !urlRegex.test(link)) ? styles.inputError : ""}`}
              type="url"
              placeholder="mywebsite.io"
              onChange={handleInputChange(setLink, "url")}
              onFocus={() => setFocusedField("url")}
              onBlur={() => handleBlur("url")}
            />
            {visitedFields.has("url") && (!link || !urlRegex.test(link)) && (
              <div className={styles.errorMessage}>
                {!link ? "This field is required." : "Please enter a valid URL."}
              </div>
            )}
          </label>
        </div>

        <div>
          <h2>Upload an image or logo of your community</h2>
          <p className={styles.maxCharacters}>
            Optional. If you upload nothing, we will use your Twitter profile
            picture. JPG, JPEG, and PNG only.
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <input type="file" accept=".png, .jpg, .jpeg" onChange={handleImageChange} />
            {imagePreview && (
              <img
                style={{ width: "100px", height: "100px", marginTop: "24px" }}
                src={imagePreview}
                alt="Image preview"
              />
            )}
          </div>
        </div>

        <div>
          <h2>How would you like people to contact you about housing?</h2>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setContactMethod, "phone")}
          >
            <div
              className={`${styles.option} ${
                contactMethod === "phone" ? styles.optionSelected : ""
              }`}
            ></div>
            Phone number
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setContactMethod, "email")}
          >
            <div
              className={`${styles.option} ${
                contactMethod === "email" ? styles.optionSelected : ""
              }`}
            ></div>
            Email address (we will use the one you signed up with)
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setContactMethod, "twitter")}
          >
            <div
              className={`${styles.option} ${
                contactMethod === "twitter" ? styles.optionSelected : ""
              }`}
            ></div>
            Twitter DMs (make sure your DMs are on)
          </div>
          <div
            className={styles.options}
            onClick={() => handleOptionClick(setContactMethod, "website")}
          >
            <div
              className={`${styles.option} ${
                contactMethod === "website" ? styles.optionSelected : ""
              }`}
            ></div>
            Website form (ensure you put this down in the link above)
          </div>

          {contactMethod === "phone" && (
            <label>
              <input
                className={`${styles.inputStyle} ${visitedFields.has("phone") && (!phone || !phoneRegex.test(phone)) ? styles.inputError : ""}`}
                type="tel"
                placeholder="Phone number"
                onChange={handleInputChange(setPhone, "phone")}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => handleBlur("phone")}
              />
              {visitedFields.has("phone") && (!phone || !phoneRegex.test(phone)) && (
                <div className={styles.errorMessage}>
                  {!phone ? "This field is required." : "Please enter a valid phone number."}
                </div>
              )}
            </label>
          )}
        </div>

        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick(e);
          }}
          className={`${styles.nextButton} ${
            isFormValid ? "" : styles.disabled
          }`}
        >
          Next
        </Link>
      </form>
    </div>
  );
};

export default MyForm;
