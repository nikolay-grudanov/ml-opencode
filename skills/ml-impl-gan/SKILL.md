---
name: ml-impl-gan
description: Полный workflow для обучения и оценки генеративных моделей Generative Models (GAN, VAE, Diffusion)
---

# Skill: Generative Models (GAN, VAE, Diffusion)

**Назначение:** Полный workflow для обучения и оценки генеративных моделей

**Тип:** Task Skill

**Загружается:** ml-impl-agent перед работой с GAN/VAE/Diffusion

---

## Когда Использовать

✅ Обучение GAN (Standard, DCGAN, WGAN, WGAN-GP)
✅ Обучение VAE (Vanilla, Beta-VAE, Conditional VAE)
✅ Обучение Diffusion Models (DDPM, Latent Diffusion)
✅ Генерация изображений, текстур, синтетических данных
✅ Оценка качества генерации (FID, IS, Precision/Recall)

---

## Workflow

### 1. Подготовка Данных

**Требования к данным:**
- Изображения одного размера (рекомендуется 64×64, 128×128, 256×256)
- Нормализация: [-1, 1] для GAN, [0, 1] для VAE
- Data augmentation опционально (может помочь при малых датасетах)

**PyTorch DataLoader:**
```python
import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# GAN transform ([-1, 1] normalization)
transform_gan = transforms.Compose([
    transforms.Resize(64),
    transforms.CenterCrop(64),
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))  # [-1, 1]
])

# VAE transform ([0, 1] normalization)
transform_vae = transforms.Compose([
    transforms.Resize(64),
    transforms.CenterCrop(64),
    transforms.ToTensor()  # [0, 1]
])

dataset = datasets.ImageFolder(root='data/images', transform=transform_gan)
dataloader = DataLoader(dataset, batch_size=64, shuffle=True, num_workers=4)
```

---

### 2. Архитектуры Моделей

#### 2.1 DCGAN (Deep Convolutional GAN)

**Generator:**
```python
import torch.nn as nn

class Generator(nn.Module):
    def __init__(self, latent_dim=100, img_channels=3, feature_maps=64):
        super().__init__()
        self.main = nn.Sequential(
            # Input: latent_dim × 1 × 1
            nn.ConvTranspose2d(latent_dim, feature_maps * 8, 4, 1, 0, bias=False),
            nn.BatchNorm2d(feature_maps * 8),
            nn.ReLU(True),
            # State: (feature_maps*8) × 4 × 4
            nn.ConvTranspose2d(feature_maps * 8, feature_maps * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.ReLU(True),
            # State: (feature_maps*4) × 8 × 8
            nn.ConvTranspose2d(feature_maps * 4, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.ReLU(True),
            # State: (feature_maps*2) × 16 × 16
            nn.ConvTranspose2d(feature_maps * 2, feature_maps, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps),
            nn.ReLU(True),
            # State: feature_maps × 32 × 32
            nn.ConvTranspose2d(feature_maps, img_channels, 4, 2, 1, bias=False),
            nn.Tanh()  # Output: img_channels × 64 × 64, range [-1, 1]
        )
    
    def forward(self, z):
        return self.main(z)
```

**Discriminator:**
```python
class Discriminator(nn.Module):
    def __init__(self, img_channels=3, feature_maps=64):
        super().__init__()
        self.main = nn.Sequential(
            # Input: img_channels × 64 × 64
            nn.Conv2d(img_channels, feature_maps, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),
            # State: feature_maps × 32 × 32
            nn.Conv2d(feature_maps, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.LeakyReLU(0.2, inplace=True),
            # State: (feature_maps*2) × 16 × 16
            nn.Conv2d(feature_maps * 2, feature_maps * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.LeakyReLU(0.2, inplace=True),
            # State: (feature_maps*4) × 8 × 8
            nn.Conv2d(feature_maps * 4, feature_maps * 8, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 8),
            nn.LeakyReLU(0.2, inplace=True),
            # State: (feature_maps*8) × 4 × 4
            nn.Conv2d(feature_maps * 8, 1, 4, 1, 0, bias=False),
            nn.Sigmoid()  # Output: 1 (probability)
        )
    
    def forward(self, img):
        return self.main(img).view(-1, 1).squeeze(1)
```

#### 2.2 Vanilla VAE

```python
class VAE(nn.Module):
    def __init__(self, latent_dim=128, img_channels=3):
        super().__init__()
        
        # Encoder
        self.encoder = nn.Sequential(
            nn.Conv2d(img_channels, 32, 4, 2, 1),  # 64 -> 32
            nn.ReLU(),
            nn.Conv2d(32, 64, 4, 2, 1),           # 32 -> 16
            nn.ReLU(),
            nn.Conv2d(64, 128, 4, 2, 1),          # 16 -> 8
            nn.ReLU(),
            nn.Conv2d(128, 256, 4, 2, 1),         # 8 -> 4
            nn.ReLU(),
            nn.Flatten()
        )
        
        self.fc_mu = nn.Linear(256 * 4 * 4, latent_dim)
        self.fc_logvar = nn.Linear(256 * 4 * 4, latent_dim)
        
        # Decoder
        self.fc_decode = nn.Linear(latent_dim, 256 * 4 * 4)
        
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(256, 128, 4, 2, 1),  # 4 -> 8
            nn.ReLU(),
            nn.ConvTranspose2d(128, 64, 4, 2, 1),   # 8 -> 16
            nn.ReLU(),
            nn.ConvTranspose2d(64, 32, 4, 2, 1),    # 16 -> 32
            nn.ReLU(),
            nn.ConvTranspose2d(32, img_channels, 4, 2, 1),  # 32 -> 64
            nn.Sigmoid()  # [0, 1] range
        )
    
    def encode(self, x):
        h = self.encoder(x)
        return self.fc_mu(h), self.fc_logvar(h)
    
    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std
    
    def decode(self, z):
        h = self.fc_decode(z).view(-1, 256, 4, 4)
        return self.decoder(h)
    
    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        return self.decode(z), mu, logvar
```

---

### 3. Обучение

#### 3.1 GAN Training Loop

```python
import torch
import torch.nn as nn
import torch.optim as optim

# Инициализация
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
latent_dim = 100

G = Generator(latent_dim).to(device)
D = Discriminator().to(device)

criterion = nn.BCELoss()
optimizer_G = optim.Adam(G.parameters(), lr=0.0002, betas=(0.5, 0.999))
optimizer_D = optim.Adam(D.parameters(), lr=0.0002, betas=(0.5, 0.999))

# Метки
real_label = 1.0
fake_label = 0.0

# Training loop
num_epochs = 100

for epoch in range(num_epochs):
    for i, (real_imgs, _) in enumerate(dataloader):
        batch_size = real_imgs.size(0)
        real_imgs = real_imgs.to(device)
        
        # Train Discriminator
        optimizer_D.zero_grad()
        
        # Real images
        label = torch.full((batch_size,), real_label, device=device)
        output = D(real_imgs)
        loss_D_real = criterion(output, label)
        loss_D_real.backward()
        
        # Fake images
        z = torch.randn(batch_size, latent_dim, 1, 1, device=device)
        fake_imgs = G(z)
        label.fill_(fake_label)
        output = D(fake_imgs.detach())
        loss_D_fake = criterion(output, label)
        loss_D_fake.backward()
        
        loss_D = loss_D_real + loss_D_fake
        optimizer_D.step()
        
        # Train Generator
        optimizer_G.zero_grad()
        label.fill_(real_label)  # Generator wants D to believe fakes are real
        output = D(fake_imgs)
        loss_G = criterion(output, label)
        loss_G.backward()
        optimizer_G.step()
        
        # Logging
        if i % 100 == 0:
            print(f"Epoch [{epoch}/{num_epochs}] Batch [{i}/{len(dataloader)}] "
                  f"Loss_D: {loss_D:.4f} Loss_G: {loss_G:.4f}")
    
    # Save checkpoint every 10 epochs
    if (epoch + 1) % 10 == 0:
        torch.save({
            'epoch': epoch,
            'G_state_dict': G.state_dict(),
            'D_state_dict': D.state_dict(),
            'optimizer_G_state_dict': optimizer_G.state_dict(),
            'optimizer_D_state_dict': optimizer_D.state_dict(),
        }, f'models/checkpoint_epoch_{epoch+1}.pth')
```

#### 3.2 VAE Training Loop

```python
def vae_loss(recon_x, x, mu, logvar):
    """VAE loss = Reconstruction + KL divergence"""
    # Reconstruction loss (Binary Cross Entropy)
    BCE = nn.functional.binary_cross_entropy(recon_x, x, reduction='sum')
    
    # KL divergence loss
    KLD = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    
    return BCE + KLD

# Инициализация
vae = VAE(latent_dim=128).to(device)
optimizer = optim.Adam(vae.parameters(), lr=1e-3)

# Training loop
for epoch in range(num_epochs):
    vae.train()
    train_loss = 0
    
    for batch_idx, (data, _) in enumerate(dataloader):
        data = data.to(device)
        optimizer.zero_grad()
        
        recon_batch, mu, logvar = vae(data)
        loss = vae_loss(recon_batch, data, mu, logvar)
        
        loss.backward()
        train_loss += loss.item()
        optimizer.step()
        
        if batch_idx % 100 == 0:
            print(f"Epoch [{epoch}] Batch [{batch_idx}] Loss: {loss.item() / len(data):.4f}")
    
    print(f"====> Epoch {epoch} Average loss: {train_loss / len(dataloader.dataset):.4f}")
```

---

### 4. Генерация Образцов

```python
# GAN: Генерация
G.eval()
with torch.no_grad():
    z = torch.randn(64, latent_dim, 1, 1, device=device)
    fake_images = G(z)
    # Денормализация [-1, 1] -> [0, 1]
    fake_images = (fake_images + 1) / 2

# VAE: Генерация
vae.eval()
with torch.no_grad():
    z = torch.randn(64, 128, device=device)
    generated_images = vae.decode(z)

# Визуализация
import torchvision.utils as vutils
import matplotlib.pyplot as plt

plt.figure(figsize=(8, 8))
plt.axis("off")
plt.title("Generated Images")
plt.imshow(vutils.make_grid(fake_images.cpu(), padding=2, normalize=True).permute(1, 2, 0))
plt.show()
```

---

### 5. Оценка Качества (FID Metric)

**FID (Fréchet Inception Distance) — главная метрика для GAN/VAE.**

```python
from pytorch_fid import fid_score

# Сохранить реальные и фейковые изображения
# real_images/ — реальные изображения
# fake_images/ — сгенерированные изображения

fid_value = fid_score.calculate_fid_given_paths(
    ['real_images/', 'fake_images/'],
    batch_size=50,
    device=device,
    dims=2048  # Inception features
)

print(f"FID Score: {fid_value:.2f}")
```

**Интерпретация FID:**
- **< 10:** Отличное качество (почти неотличимо от реальных)
- **10-20:** Хорошее качество
- **20-50:** Приемлемое качество
- **> 50:** Плохое качество (нужно улучшать)

---

### 6. Чекпоинты и Логирование

**Сохранение чекпоинтов каждые N эпох:**
```python
if (epoch + 1) % 10 == 0:
    checkpoint_path = f'models/checkpoint_epoch_{epoch+1}.pth'
    torch.save({
        'epoch': epoch,
        'model_state_dict': G.state_dict(),  # или vae.state_dict()
        'optimizer_state_dict': optimizer_G.state_dict(),
        'loss': loss,
        'fid_score': fid_value  # если вычислен
    }, checkpoint_path)
    print(f"Checkpoint saved: {checkpoint_path}")
```

**Логирование с Weights & Biases:**
```python
import wandb

wandb.init(project="gan-training", name="dcgan-faces")

# В training loop
wandb.log({
    "loss_D": loss_D.item(),
    "loss_G": loss_G.item(),
    "epoch": epoch,
    "generated_images": wandb.Image(fake_images)
})
```

---

## Best Practices

### GAN Stability Tips

1. **Learning Rate:** 0.0002 для Adam, betas=(0.5, 0.999)
2. **Batch Size:** 64 или 128 (больше = стабильнее)
3. **Label Smoothing:** real_label = 0.9 вместо 1.0
4. **Gradient Penalty:** Используйте WGAN-GP для стабильности
5. **Progressive Growing:** Начинайте с малого разрешения

### VAE Tips

1. **Beta-VAE:** Добавьте вес к KL loss для лучшей дизентангляции
2. **Reconstruction Quality:** Используйте MSE или LPIPS loss
3. **Latent Dimension:** 128-512 для изображений

### Debugging

**Mode Collapse (GAN):**
- Симптом: Генератор создаёт одинаковые изображения
- Решение: Уменьшите learning rate G, используйте minibatch discrimination

**Blurry Images (VAE):**
- Симптом: Размытые реконструкции
- Решение: Уменьшите вес KL loss, используйте perceptual loss

---

## Резюме

✅ **DCGAN** — для качественной генерации изображений
✅ **VAE** — для интерполяций и контролируемой генерации
✅ **FID metric** — обязательна для оценки
✅ **Чекпоинты** — сохраняйте каждые 10 эпох
✅ **Визуализация** — генерируйте образцы для отслеживания прогресса

**Успешного обучения генеративных моделей!** 🎨🚀