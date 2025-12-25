"use client";

import {useAccount, useSignMessage} from "wagmi";
import {useState, useEffect} from "react";
import {supabase} from "@/lib/supabase";

type Props = {
  serviceId: number;
  currentRating: number;
  ratingCount: number;
  onRatingUpdate: () => void;
};

export default function StarRating({serviceId, currentRating, ratingCount, onRatingUpdate}: Props) {
  const {address, isConnected} = useAccount();
  const {signMessageAsync} = useSignMessage();
  const [hasVoted, setHasVoted] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    async function checkVote() {
      if (!address) return;
      const {data, error} = await supabase
        .from("reviews")
        .select("rating")
        .eq("service_id", serviceId)
        .eq("wallet", address.toLowerCase())
        .maybeSingle(); // safe, returns null if no row

      if (data) {
        setHasVoted(true);
        setUserRating(data.rating);
      } else {
        setHasVoted(false);
        setUserRating(0);
      }
    }
    checkVote();
  }, [address, serviceId]);

  async function submitRating(rating: number) {
    if (!isConnected || !address) return alert("Connect wallet first");
    if (hasVoted) return;

    try {
      const message = `Rate service ${serviceId} with ${rating} stars`;
      const signature = await signMessageAsync({message});

      // Insert review
      const {error: reviewError} = await supabase.from("reviews").insert({
        service_id: serviceId,
        wallet: address.toLowerCase(),
        rating,
      });

      if (reviewError) throw reviewError;

      // Update service totals
      // Because supabase-js v2 does not support .raw or database-side increments directly,
      // we need to fetch the current values and update them in-app:
      const {data: service, error: fetchError} = await supabase.from("services").select("rating_sum, rating_count").eq("id", serviceId).single();

      if (fetchError) throw fetchError;

      const newRatingSum = (service?.rating_sum ?? 0) + rating;
      const newRatingCount = (service?.rating_count ?? 0) + 1;

      const {error: updateError} = await supabase
        .from("services")
        .update({
          rating_sum: newRatingSum,
          rating_count: newRatingCount,
        })
        .eq("id", serviceId);

      if (updateError) throw updateError;

      setHasVoted(true);
      setUserRating(rating);
      onRatingUpdate();
    } catch (err) {
      console.error(err);
      alert("Rating failed");
    }
  }

  if (!isConnected) {
    return <p className="text-gray-500 mt-4">Connect wallet to rate</p>;
  }

  if (hasVoted) {
    return <p className="text-cyan-400 mt-4">You rated {userRating}★</p>;
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => submitRating(star)}
          className="text-4xl transition"
        >
          {hoverRating || star <= currentRating ? "★" : "☆"}
        </button>
      ))}
      <span className="text-gray-500">Click to rate</span>
    </div>
  );
}
