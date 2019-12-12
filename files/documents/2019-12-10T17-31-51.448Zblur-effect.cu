#include <stdio.h>
#include <opencv2/opencv.hpp>
#include <cuda_runtime.h>
#include "omp.h"
#include <iostream>


using namespace std;
using namespace cv;

//nvcc blur-effect.cu -o blur-effect `pkg-config opencv --libs`
int rows;
int cols;
int** img;

using namespace cv;
struct pixel{
  int R, G, B;
};

char add_c[9] = {'m','o','d','i','f','i','e','d','_'};

__global__ void blur(pixel *image, int KERNEL_SIZE, int totalThreads, int rows, int cols){
  int initIteration, endIteration;
  int i,j,k,l, index;
  index = (blockDim.x * blockIdx.x) + threadIdx.x;
  initIteration = (rows/totalThreads)*index;
  endIteration = initIteration + (rows/totalThreads) - 1;
  if(index == totalThreads -1 ){
    endIteration = rows-1;
  }

  printf("start : %d   end: %d", initIteration, endIteration);

  for(i = initIteration; i <= endIteration; i++){
    for(j = 0; j < cols; j++){

      int x1, x2;
      int y1, y2;

      //Verifica y asigna la cantidad de espacios para hacer el promedio
      if( j - KERNEL_SIZE >= 0 )
      x1 = j - KERNEL_SIZE;
      else
      x1 = 0;

      if( j + KERNEL_SIZE < cols )
      x2 = j + KERNEL_SIZE;
      else
      x2 = cols-1;

      if( i - KERNEL_SIZE >= 0 )
      y1 = i - KERNEL_SIZE;
      else
      y1 = 0;

      if( i + KERNEL_SIZE < rows )
      y2 = i + KERNEL_SIZE;
      else
      y2 = rows-1;


      int b = 0, r = 0, g = 0, c = 0;

      for( k = y1; k <= y2; k++){
        for( l = x1; l <= x2; l++ ){
          b += image[k*cols +l].B;
          g += image[k*cols +l].G;
          r += image[k*cols +l].R;
          c++;
        }
      }


      image[i*cols + j].B = (b/c);
      image[i*cols + j].G = (g/c);
      image[i*cols + j].R = (r/c);



    }
  }



}

int* average( int row, int column, int kernel){

  int x1, x2;
  int y1, y2;

  //Verifica y asigna la cantidad de espacios para hacer el promedio
  if( column - kernel >= 0 )
  x1 = column - kernel;
  else
  x1 = 0;

  if( column + kernel < cols )
  x2 = column + kernel;
  else
  x2 = cols-1;

  if( row - kernel >= 0 )
  y1 = row - kernel;
  else
  y1 = 0;

  if( row + kernel < rows )
  y2 = row + kernel;
  else
  y2 = rows-1;

  int R = 0, G = 0, B = 0;


  //ALmacena los valores de R, G y B  en cada capa del pixel.
  for( int i = y1; i <= y2; i++){
    for( int j = x1; j <= x2; j++ ){
      int * temp = *(img + i * cols + j);
      R += *(temp + 2);
      G += *(temp + 1);
      B += *(temp);
    }
  }

  //Saca el promedio para cada pixel diviendo entre el tamaño de kernel.
  int* ans = new int[3];
  int size = (x2 - x1 + 1)*(y2 - y1 + 1);
  ans[0] = (int)(B / size);
  ans[1] = (int)(G / size);
  ans[2] = (int)(R / size);
  return ans;

}


int main(int argc, const char *argv[]){
  int N_THREADS;
  int N_BLOCKS;
  int KERNEL_SIZE;
  int flag = 0;
  cudaError_t err = cudaSuccess;



  if( argc < 3){
    printf("Usage: <img_path> <kernel_size> <thread_number> \n");
    return -1;
  }
  sscanf(argv[2],"%d", &KERNEL_SIZE);
  sscanf(argv[3],"%d", &N_BLOCKS);
  sscanf(argv[4],"%d", &N_THREADS);

  if(N_THREADS == 1){
    flag=1;
  }

  Mat image = imread(argv[1], CV_LOAD_IMAGE_COLOR);

  int size = image.rows*image.cols*sizeof(struct pixel);

  pixel * im = (pixel*)malloc(size);

  char * name = (char*)malloc(sizeof(argv[1]) + sizeof(add_c) + 1);
  name[0] = 0;
  strcat(name,add_c);
  strcat(name,argv[1]);

  if(flag==1){

    char* nameImage = name;


    //Verificar el contenido de la imagen
    if( !image.data ){
      cout << "No image data" << endl;
      return -1;
    }

    //Identifica la cantidad de filas y columnas de la imagen escrita como parámetro.
    rows = image.rows;
    cols = image.cols;
    img = new int * [rows * cols];


    //Lee el argumento del kernel.
    int kernel = atoi( argv[2] );

    omp_set_num_threads(flag);
    #pragma omp parallel for
    for( int i = 0; i < rows * cols; i++) {
      *(img + i) = new int[3];
      *(*(img + i))  = image.at<Vec3b>( int(i / cols), i % cols )[0];
      *(*(img + i) + 1) = image.at<Vec3b>( int(i / cols), i % cols )[1];
      *(*(img + i) + 2) = image.at<Vec3b>( int(i / cols), i % cols )[2];
    }

    //Asigna el nuevo pixel (promediado) a la imagen que se tenía.
    omp_set_num_threads(flag);
    #pragma omp parallel for
    for( int r = 0; r < rows; r++ ){
      for( int c = 0; c < cols; c++ ){
        int* BGR = average( r, c, int((kernel - 1)/0.5) );
        image.at<Vec3b>( r, c )[2] = BGR[2];
        image.at<Vec3b>( r, c )[1] = BGR[1];
        image.at<Vec3b>( r, c )[0] = BGR[0];
      }
    }
    imwrite( nameImage, image);
  }


  if(flag ==0){


    for(int i = 0; i < image.rows; i++){
      for(int j = 0; j < image.cols; j++){
        im[i*image.cols +j].B = image.at<Vec3b>(i,j)[0];
        im[i*image.cols +j].G = image.at<Vec3b>(i,j)[1];
        im[i*image.cols+ j].R = image.at<Vec3b>(i,j)[2];
      }
    }

    pixel * d_im;
    err = cudaMalloc((void**)&d_im, sizeof(struct pixel)*image.rows*image.cols);
    if (err != cudaSuccess){
      fprintf(stderr, "(error allocating in device code %s)!\n", cudaGetErrorString(err));
      exit(EXIT_FAILURE);
    }
    printf("allocated\n");

    err = cudaMemcpy(d_im, im, size, cudaMemcpyHostToDevice);

    if (err != cudaSuccess){
      fprintf(stderr, "error copy from host to device( code %s)!\n", cudaGetErrorString(err));
      exit(EXIT_FAILURE);
    }
    printf("copy from host to device\n");


    printf("launching kernel\n");
    blur<<<N_BLOCKS, N_THREADS>>>(d_im, KERNEL_SIZE, N_THREADS, image.rows, image.cols);

    err = cudaGetLastError();
    if (err != cudaSuccess){
      fprintf(stderr, "Failed to launch vectorAdd kernel (error code %s)!\n", cudaGetErrorString(err));
      exit(EXIT_FAILURE);
    }
    printf("kernel finished\n");

    err = cudaMemcpy(im, d_im, size, cudaMemcpyDeviceToHost);

    if (err != cudaSuccess){
      fprintf(stderr, "error copy from device to host( code %s)!\n", cudaGetErrorString(err));
      exit(EXIT_FAILURE);
    }
    printf("copy from device to host\n");

    for(int i = 0; i < image.rows; i++){
      for(int j = 0; j < image.cols; j++){
        image.at<Vec3b>(i,j)[0] = im[i*image.cols + j].B;
        image.at<Vec3b>(i,j)[1] = im[i*image.cols + j].G;
        image.at<Vec3b>(i,j)[2] = im[i*image.cols + j].R;
      }
    }
    if(!image.data){
      printf("no image data\n");
      return -1;
    }

    imwrite(name, image);

    free(im);
    err = cudaFree(d_im);

    if (err != cudaSuccess){
      fprintf(stderr, "error free( code %s)!\n", cudaGetErrorString(err));
      exit(EXIT_FAILURE);
    }
  }
  return 0;
}
