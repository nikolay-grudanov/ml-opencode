---
name: ml-impl-cv
description: >
  Computer vision skill for designing data augmentation pipelines and custom
  CNN/ResNet-like architectures trained from scratch, with clear architecture
  specs and motivation.
version: 1
---

# Skill goal

This skill teaches the agent how to:
- design **image augmentation** pipelines for training datasets;
- decide when and how to train a **convolutional model from scratch**;
- design and describe a **custom CNN / ResNet-like architecture**;
- document the architecture and training process in a way that is useful for
  implementation (scripts, notebooks) and later maintenance.

Use this skill whenever the task mentions computer vision, image recognition,
image classification, detection, segmentation, or data augmentation.

---

# How to think with this skill

When you see a CV task, follow this mental pipeline:

1. Clarify the problem
   - Identify task type: classification, detection, segmentation, multi-label.
   - Identify domain: natural images, medical, satellite, documents/OCR, etc.
   - Ask (or infer) dataset size, class count, and hardware constraints (GPU,
     training time, latency/size limits).

2. Decide on training strategy
   - If dataset is small (<50–100k images) and domain is ImageNet-like, strongly
     prefer transfer learning and explicitly say that training from scratch is
     likely inefficient.
   - If dataset is large or domain is very different (medical, satellite,
     special sensors), then training from scratch is acceptable, but:
     - be explicit about regularization, augmentation strength, and learning
       rate schedule;
     - mention that more epochs and careful monitoring are required.

3. Separate concerns
   - Data pipeline (datasets, augmentations, normalization).
   - Model architecture (blocks, depth, width, residual design).
   - Training loop and hyperparameters (loss, optimizer, LR schedule).
   - Evaluation and interpretation (metrics, plots, qualitative checks).

Always keep these as separate sections in your answer so that they can be
mapped to separate modules/files later (e.g. `dataset.py`, `transforms.py`,
`models/custom_resnet.py`, `train.py`).

---

# Designing augmentation pipelines

When the user asks for: “Разработайте набор аугментаций для расширения обучающего датасета”:

1. Analyze constraints
   - Task type and labels: does geometry change the label?
     - Digits, text, medical orientation-sensitive images → avoid rotations
       that change semantics.
   - Domain:
     - natural images: flips, crops, color jitter are usually ok;
     - medical/satellite: be careful with rotations and aggressive color changes.

2. Classify augmentations

   Geometric (shape/position):
   - RandomResizedCrop / RandomCrop
   - RandomHorizontalFlip (and Vertical if semantics allow)
   - RandomRotation (only if label is rotation-invariant)
   - RandomPerspective / affine transforms (if realistic for the domain)

   Photometric (appearance):
   - ColorJitter (brightness/contrast/saturation/hue)
   - RandomGrayscale
   - GaussianBlur
   - random noise

   Regularization:
   - RandomErasing / Cutout
   - mixup / cutmix for classification (if compatible with metrics and loss)

3. Practical rules

   - Apply augmentations **only to training data**; keep validation/test with
     minimal deterministic preprocessing (resize, center crop, normalization).
   - Avoid augmentations that systematically break labels or change the class.
   - Keep augmentation configuration centralized, for example:
     - a `get_train_transforms(config)` and `get_val_transforms(config)`
       function;
     - a single `transforms.py` module that is imported by dataloaders.

4. How to respond

   When asked to “design augmentations”, produce:

   - A bullet list of transforms with parameters and ordering, for example:

     - Resize to 256, RandomResizedCrop to 224.
     - RandomHorizontalFlip (p=0.5).
     - ColorJitter (brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1).
     - RandomGrayscale (p=0.1).
     - RandomErasing after normalization (p=0.25).

   - For each augmentation, add 1–2 sentences of **motivation**, such as:
     - improves invariance to camera position;
     - simulates lighting changes;
     - helps combat overfitting on small datasets.

   - Optionally, specify how to structure the code:
     - suggest functions like `build_train_transforms()` and
       `build_val_transforms()`;
     - define clear interfaces the implementation should follow.

---

# Training a model from scratch

When the prompt emphasizes “Модель, обучаемая с нуля”:

1. Validate whether it makes sense
   - If dataset is small and domain is similar to ImageNet, explain that
     training from scratch is **not recommended** and propose transfer learning
     as a baseline plus a “from scratch” experiment only if explicitly needed.
   - If dataset is large or domain is unusual, confirm that training from
     scratch is reasonable and state expected costs (more epochs, careful
     regularization, higher risk of overfitting).

2. Core practices for training from scratch

   - Use dataset-specific normalization (compute channel-wise mean/std from the
     training set instead of blindly using ImageNet stats).
   - Use stronger data augmentation early in training; consider gradually
     reducing augmentation strength later.
   - Choose a scheduler (cosine decay, multi-step, or one-cycle) and mention:
     - initial learning rate;
     - warmup strategy if appropriate.
   - Combine regularization methods:
     - weight decay;
     - dropout in classifier or deeper layers if overfitting is observed;
     - label smoothing for classification, where appropriate.

3. Reporting

   Always include in your answer:

   - The loss function and why it is appropriate for the task.
   - The optimizer (SGD with momentum vs Adam/AdamW) and the main hyperparams.
   - The LR schedule and number of epochs.
   - Which metrics will be tracked (accuracy, F1, IoU, etc.) and which one is
     used to select the best checkpoint.
   - A short numbered list for “Implementation plan” that can be turned into a
     `train.py` or notebook.

---

# Designing a custom CNN / ResNet-like architecture

When asked to “Реализуйте собственную сверточную нейронную сеть (например, ResNet-подобную архитектуру). Опишите архитектуру и мотивацию выбранных решений”:

1. Start with a clear high-level spec

   - Input resolution, number of channels.
   - Number of stages (e.g. 4–5), each with:
     - spatial downsampling strategy;
     - number of blocks per stage;
     - channel width per stage.
   - Type of residual block:
     - basic block (two 3×3 convolutions) for shallow models;
     - bottleneck (1×1 → 3×3 → 1×1) for deeper models.

2. Define the building blocks

   - Standard block: `Conv -> BatchNorm -> ReLU`.
   - Residual block:
     - main path: sequence of conv-BN-ReLU layers;
     - shortcut path:
       - identity if input and output shapes match;
       - 1×1 conv with stride for downsampling or channel change.
   - Stem:
     - either a single 7×7 conv with stride 2 + max-pooling,
     - or a stack of 3×3 convs (for smaller receptive fields but more non-linearity).

3. Global structure

   - Example skeleton:

     - Stem
     - Stage 1: N1 residual blocks, C1 channels
     - Stage 2: N2 residual blocks, C2 channels, first block with stride 2
     - Stage 3: N3 residual blocks, C3 channels, first block with stride 2
     - Stage 4: N4 residual blocks, C4 channels, first block with stride 2
     - Global average pooling
     - Fully connected classifier with number of output units = number of
       classes

4. Motivation to include in the answer

   For each major design choice, clearly state *why*:

   - Residual connections:
     - ease optimization in deeper networks;
     - reduce degradation problem when adding more layers.
   - Bottleneck blocks:
     - allow deeper networks with fewer parameters and FLOPs;
     - helpful when GPU memory is limited.
   - BatchNorm (or alternative normalization):
     - stabilizes training and allows higher learning rates.
   - Global average pooling:
     - reduces number of parameters and overfitting compared to large fully
       connected layers.

5. How to express the architecture

   - Provide **both**:
     - a textual description (stages, blocks, channels, strides);
     - a pseudo-API for the implementation, for example:

       - `class CustomResNet(nn.Module):`
         - `__init__(self, num_classes: int, block_config: List[int], widths: List[int], ...)`
         - `forward(self, x) -> Tensor`

   - Keep implementation-independent:
     - do not hard-code PyTorch or Keras in the spec, but mention either or
       both as targets;
     - focus on shapes, blocks, and behavior, not on framework-specific APIs.

---

# Documentation and best-practice output format

Whenever you use this skill, structure your answer into sections:

1. Problem and data
   - Task type, domain, dataset assumptions, constraints.

2. Data pipeline
   - Augmentations (with parameters and motivations).
   - Normalization and input size.
   - Notes about class imbalance handling if relevant.

3. Model architecture
   - High-level model family (simple CNN, ResNet-like, etc.).
   - Stage/block configuration and key design rationales.

4. Training strategy
   - Loss, optimizer, LR schedule, regularization.
   - Monitoring and checkpointing strategy.

5. Implementation plan
   - Numbered list of steps that can be directly turned into:
     - modules (`dataset.py`, `transforms.py`, `models/custom_resnet.py`);
     - scripts or notebooks (`train.py`, `train.ipynb`).

Keep answers concise but structured, so that another agent (or a human) can
directly implement the described plan.

