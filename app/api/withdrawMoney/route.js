import { NextRequest, NextResponse } from "next/server";
import { getChips, updateChips } from "@/supabaseClient";
const jwt = require("jsonwebtoken");

export async function POST(NextRequest) {
  try {
    // const reqBody = await NextRequest.json();
    // const { token, amount } = reqBody;

    let body = await NextRequest.json();

    const token = body.token;
    // let jsonToken = JSON.parse(token);
    const amount = body.amount;

    // console.log("decode", typeof token);
    // console.log(JSON.parse(token));

    let decode = jwt.verify(token, process.env.SUPABASE_SECRET_KEY, {
      algorithms: ["HS256"],
    });

    // console.log(decode);

    let userId = decode["userid"];
    // console.log(userId);

    if (!userId || !amount) {
      return NextResponse.json(
        { error: "Missing userId or amount" },
        { status: 400 }
      );
    }

    let response;
    const userChips = await getChips(token, decode["userid"]);
    if (amount <= userChips) {
      let final = userChips - amount;
      response = await updateChips(token, decode["userid"], final);
    }
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred at withdrawMoney server: " + error.message },
      { status: 500 }
    );
  }
}
