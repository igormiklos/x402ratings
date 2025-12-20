"use client";

import {useAccount, useSignMessage} from "wagmi";
import {createClient} from "@supabase/supabase-js";
import {useState, useEffect} from "react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface StarRatingProps {
  serviceId: number;
  currentRating: number;
  ratingCount: number;
  onRatingUpdate: () => void;
}

export default function StarRating({serviceId, currentRating, ratingCount, onRatingUpdate}: StarRatingProps) {
  const {address, isConnected} = useAccount();
  const {signMessageAsync, isPending: isSigning} = useSignMessage();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUserRating, setLoadingUserRating] = useState(true);

  // Check if user already rated this service
  useEffect(() => {
    async function checkUserRating() {
      if (!isConnected || !address) {
        setLoadingUserRating(false);
        return;
      }

      const {data, error} = await supabase
        .from("reviews")
        .select("rating")
        .eq("service_id", serviceId)
        .eq("wallet_address", address.toLowerCase())
        .maybeSingle();

      if (data) {
        setUserRating(data.rating);
      }
      setLoadingUserRating(false);
    }

    checkUserRating();
  }, [isConnected, address, serviceId]);

  async function handleStarClick(rating: number) {
    console.log("Star clicked:", rating, {isConnected, address, isSubmitting, userRating});
    
    if (!isConnected || !address) {
      alert("Please connect your wallet to rate.");
      return;
    }

    if (isSubmitting || isSigning) {
      return;
    }

    // Prevent double vote
    if (userRating !== null) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if wallet already voted on this service_id
      const {data: existingReview} = await supabase
        .from("reviews")
        .select("rating")
        .eq("service_id", serviceId)
        .eq("wallet_address", address.toLowerCase())
        .maybeSingle();

      if (existingReview) {
        setUserRating(existingReview.rating);
        setIsSubmitting(false);
        return;
      }

      // Create message to sign
      const message = `Rate service ${serviceId} with ${rating} stars`;
      console.log("Signing message:", message);
      
      // Sign the message (free, no gas) using viem/wagmi
      const signature = await signMessageAsync({
        message,
      });
      console.log("Signature received:", signature);

      // Insert rating into reviews table
      const {error: insertError} = await supabase.from("reviews").insert({
        service_id: serviceId,
        rating: rating,
        wallet_address: address.toLowerCase(),
        signature: signature,
      });

      if (insertError) {
        // If error is due to duplicate, check existing rating
        if (insertError.code === "23505") {
          // Unique constraint violation - user already rated
          const {data} = await supabase
            .from("reviews")
            .select("rating")
            .eq("service_id", serviceId)
            .eq("wallet_address", address.toLowerCase())
            .maybeSingle();
          
          if (data) {
            setUserRating(data.rating);
          }
          setIsSubmitting(false);
          return;
        }
        throw insertError;
      }

      // Update service rating_sum += rating, rating_count += 1
      const {data: serviceData} = await supabase
        .from("services")
        .select("rating_sum, rating_count")
        .eq("id", serviceId)
        .single();

      if (serviceData) {
        const newRatingSum = (serviceData.rating_sum || 0) + rating;
        const newRatingCount = (serviceData.rating_count || 0) + 1;

        await supabase
          .from("services")
          .update({
            rating_sum: newRatingSum,
            rating_count: newRatingCount,
          })
          .eq("id", serviceId);
      }

      setUserRating(rating);
      // Re-load services
      onRatingUpdate();
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert(`Failed to submit rating: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isConnected) {
    return null; // Don't show stars if wallet not connected
  }

  if (loadingUserRating) {
    return <div className="text-sm text-gray-500 mt-2">Loading...</div>;
  }

  return (
    <div className="mt-4">
      {userRating !== null ? (
        <p className="text-sm text-cyan-400">You rated {userRating}★</p>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-400 mr-2">Rate:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStarClick(star);
              }}
              disabled={isSubmitting || isSigning}
              className={`text-2xl transition-all hover:scale-110 hover:text-yellow-400 ${
                isSubmitting || isSigning ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
              }`}
              type="button"
              aria-label={`Rate ${star} stars`}
            >
              ☆
            </button>
          ))}
          {(isSubmitting || isSigning) && <span className="text-xs text-gray-500 ml-2">Submitting...</span>}
        </div>
      )}
    </div>
  );
}

