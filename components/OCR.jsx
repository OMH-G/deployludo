import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";

export default function OCR(props) {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [errorText, setErrorText] = useState(""); // State for error message
  const [roomValue, setRoomValue] = useState(0);
  // const { roomCode } = props; // Destructure the roomCode from props
  const router = useRouter();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchCurrentRoomData = async () => {
      const token = await getToken({ template: "supabase" });
      const data = { id: props.roomId, token: token };
      console.log("OCR room data", data);
      // const roomData = await axios.post(
      //   "https://ludo-server-teal.vercel.app/fetchroombyid",
      //   data
      // );
      const roomData = await axios.post("/api/fetchRoomValueById", data, {
        withCredentials: true,
      });
      console.log("setRoomValue", roomData.data);
      setRoomValue(roomData.data);
    };

    fetchCurrentRoomData();
  }, []);

  const handleImageChange = (event) => {
    const selectedImage = event.target.files[0];
    // Check if the selected file is an image
    if (selectedImage && selectedImage.type.startsWith("image/")) {
      setImage(URL.createObjectURL(selectedImage));
      setErrorText(""); // Clear any previous error message
    } else {
      // Display an error message for non-image files
      setErrorText("Selected file is not an image.");
    }
  };

  const performOCR = async () => {
    try {
      if (image) {
        const {
          data: { text },
        } = await Tesseract.recognize(
          image,
          "eng" // Language code for English
        );
        setExtractedText(text);
        // console.log(text);

        const hasCongratulations = text.includes("Congratulations");
        // const hasMatchingRoomCode = roomCode && text.includes(roomCode);

        // if (hasCongratulations && hasMatchingRoomCode) {
        //   setResultMessage("Congratulations! You won the match.");
        // } else if (hasCongratulations && !hasMatchingRoomCode) {
        //   setResultMessage("Room code does not match.");
        // } else {
        //   setResultMessage("You lost the match. ");
        // }

        const token = await getToken({ template: "supabase" });
        let data = {
          hasCongratulations,
          roomId: props.roomId,
          token: token,
          roomValue: roomValue,
        };
        if (hasCongratulations) {
          setResultMessage(
            "Congratulations! You won the match.Chips will be added to your wallet."
          );
          let isWinner = await axios.post("/api/gameResult", data, {
            withCredentials: true,
          });
          console.log("isWinner", isWinner.data);
        } else {
          setResultMessage(
            "You lost the match.Chips will be deduced from your wallet. "
          );
          let isWinner = await axios.post("/api/gameResult", data, {
            withCredentials: true,
          });
          console.log("isLoser", isWinner.data);
        }
        setTimeout(() => {
          router.push("/rooms", { scroll: false });
        }, 5000);
      }
    } catch (error) {
      console.error("Error while getting the game result:", error);
    }
  };

  // Check if an image is selected to enable the "Submit" button
  const isSubmitDisabled = !image;

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="text-center">
        <p>Please upload the Screenshot </p>
        <p>after the game. </p>
        <input
          className="my-4 w-11/12"
          type="file"
          accept="image/*" // Allow only image files
          onChange={handleImageChange}
        />
        {errorText && <p className="text-red-500">{errorText}</p>}
        <div className="">
          {image && (
            <Image
              src={image}
              alt="Selected Image"
              width={250}
              height={600}
              layout="responsive"
            />
          )}
        </div>

        <button
          onClick={performOCR}
          className={`w-11/12 md:w-1/4 bg-blue-600 text-white px-3 py-1 md:py-2 text-xl rounded-lg my-2 text-center ${
            isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitDisabled} // Disable the button if no image is selected
        >
          Submit
        </button>
        {extractedText && (
          <div>
            <h2>Result:</h2>
            <p className="flex justify-center items-center m-4 bg-gray-100 p-2 rounded-md">
              {resultMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
