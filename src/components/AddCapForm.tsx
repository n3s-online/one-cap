import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the validation schema with zod
const capFormSchema = z.object({
  name: z
    .string()
    .min(1, "Cap name is required")
    .max(64, "Cap name must be less than 64 characters"),
  letter: z.string().length(1, "Letter must be exactly 1 character"),
  color: z.string().min(1, "Cap color is required"),
  letterColor: z.string().min(1, "Letter color is required"),
  playlist: z.string().min(1, "Playlist is required"),
});

// Infer the type from the schema
type CapFormData = z.infer<typeof capFormSchema>;

interface AddCapFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSubmit: (capData: CapFormData) => void;
  initialData?: CapFormData;
}

const AddCapForm: React.FC<AddCapFormProps> = ({
  isOpen,
  onCancel,
  onSubmit,
  initialData = {
    name: "",
    letter: "",
    color: "#000000",
    letterColor: "#ffffff",
    playlist: "lofi",
  },
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CapFormData>({
    resolver: zodResolver(capFormSchema),
    defaultValues: initialData,
  });

  // Watch the letter field to transform it to uppercase
  const letterValue = watch("letter");
  React.useEffect(() => {
    if (letterValue && letterValue.length > 0) {
      const uppercaseLetter = letterValue.charAt(0).toUpperCase();
      if (uppercaseLetter !== letterValue) {
        setValue("letter", uppercaseLetter);
      }
    }
  }, [letterValue, setValue]);

  if (!isOpen) return null;

  const onFormSubmit = (data: CapFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <div className="cap-form-overlay">
      <div className="cap-form-container">
        <h2>Add New Cap</h2>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="form-group">
            <label htmlFor="capName">Cap Name:</label>
            <input
              type="text"
              id="capName"
              {...register("name")}
              autoComplete="off"
            />
            {errors.name && (
              <p className="error-message">{errors.name.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="capLetter">Letter:</label>
            <input
              type="text"
              id="capLetter"
              maxLength={1}
              {...register("letter")}
              autoComplete="off"
            />
            {errors.letter && (
              <p className="error-message">{errors.letter.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="capColor">Cap Color:</label>
            <input type="color" id="capColor" {...register("color")} />
            {errors.color && (
              <p className="error-message">{errors.color.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="letterColor">Letter Color:</label>
            <input type="color" id="letterColor" {...register("letterColor")} />
            {errors.letterColor && (
              <p className="error-message">{errors.letterColor.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="playlist">Playlist:</label>
            <select id="playlist" {...register("playlist")}>
              <option value="lofi">Lofi</option>
            </select>
            {errors.playlist && (
              <p className="error-message">{errors.playlist.message}</p>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit">Add Cap</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCapForm;
