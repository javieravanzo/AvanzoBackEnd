//Definición de librerías, importante incluir la de cuda_runtime ya que define las funciones y tipos de datos necesarios
//para el API CUDA.
#include <stdio.h>
#include <cuda_runtime.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include <png.h>

//Definición de variables
int x, y;
int width, height;
png_byte color_type;
png_byte bit_depth;
png_structp png;
png_infop info;
int number_of_passes;
png_bytep *rowPointer;
png_bytep *rowPointer2;
png_bytep *rowPointer3;

//Descripción de funciones
void abort_(const char * s, ...){
        va_list args;
        va_start(args, s);
        vfprintf(stderr, s, args);
        fprintf(stderr, "\n");
        va_end(args);
        abort();
}


void read_png_file(char* file_name){

        char header[8];

        FILE *fp = fopen(file_name, "rb");
        if (!fp)
                abort_("[read_png_file] File %s could not be opened for reading", file_name);
        fread(header, 1, 8, fp);


        png = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);

        if (!png)
                abort_("[read_png_file] png_create_read_struct failed");

        info = png_create_info_struct(png);
        if (!info)
                abort_("[read_png_file] png_create_info_struct failed");

        if (setjmp(png_jmpbuf(png)))
                abort_("[read_png_file] Error during init_io");


        png_init_io(png, fp);
        png_set_sig_bytes(png, 8);
        png_read_info(png, info);
        width = png_get_image_width(png, info);
        height = png_get_image_height(png, info);
        color_type = png_get_color_type(png, info);
        bit_depth = png_get_bit_depth(png, info);
        number_of_passes = png_set_interlace_handling(png);
        png_read_update_info(png, info);

        if (setjmp(png_jmpbuf(png)))
                abort_("[read_png_file] Error during read_image");

        rowPointer = (png_bytep*) malloc(sizeof(png_bytep) * height);
        for (y=0; y<height; y++)
                rowPointer[y] = (png_byte*) malloc(png_get_rowbytes(png,info));

        png_read_image(png, rowPointer);
        fclose(fp);
}

void write_png_file(char* file_name){

        FILE *fp = fopen(file_name, "wb");
        if (!fp)
                abort_("[write_png_file] File %s could not be opened for writing", file_name);

        png = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);

        if (!png)
                abort_("[write_png_file] png_create_write_struct failed");

        info = png_create_info_struct(png);

        if (!info)
                abort_("[write_png_file] png_create_info_struct failed");

        if (setjmp(png_jmpbuf(png)))
                abort_("[write_png_file] Error during init_io");

        png_init_io(png, fp);

        if (setjmp(png_jmpbuf(png)))
                abort_("[write_png_file] Error during writing header");

        png_set_IHDR(png, info, width, height,
                     bit_depth, color_type, PNG_INTERLACE_NONE,
                     PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);

        png_write_info(png, info);

        if (setjmp(png_jmpbuf(png)))
                abort_("[write_png_file] Error during writing bytes");

        png_write_image(png, rowPointer);

        if (setjmp(png_jmpbuf(png)))
                abort_("[write_png_file] Error during end of write");

        png_write_end(png, NULL);

        for (y=0; y<height; y++)
                free(rowPointer[y]);

        free(rowPointer);
        fclose(fp);}


__global__ void myBlur3( int *r_I, int *g_I,  int *b_I, int totalPixels, int height, int nthrds,int begin2 , int end2, int p , int nrows , int width){

   // int i = blockDim.x * blockIdx.x + threadIdx.x;
    int idx =  threadIdx.x;
    int istart,iend;
    
      if ( idx!= 0 ) {
        istart = idx * height*width / nthrds;
        iend = (idx +1) * height *width/ nthrds;
        if (iend + p >= height*width){
          iend = (height*width)-p ;
        }
        
      }else {
        istart =begin2;
        iend = end2;
      }
	
	 int i,aux;

    // printf("start  %i end %i width  %i height %i \n", istart, iend,width, height );

    // printf("empieza  red %d  green %d blue %d\n", r_I[368676], g_I[368676],b_I[368676] );
    // printf(" red %d  green %d blue %d\n", r_I[iend], g_I[iend],b_I[iend] );
	for( i = istart; i <  iend; i++){
		if ( i < width ){
			aux=0;	
		}
		if ( i+width >= (height*width) ){
			aux=0;	
		}	
		if(  nrows == 3){
	 		//printf("START  red %d  green %d blue %d\n", r_I[i], g_I[i],b_I[i] );
			r_I[i] = (double)(r_I[i]+r_I[i-1]+r_I[i+1]+r_I[i-aux]+r_I[i-1-aux]+r_I[i+1-aux]+r_I[i+aux]+r_I[i-1+aux]+r_I[i+1+aux])/9;
			g_I[i] = (double)(g_I[i]+g_I[i-1]+g_I[i+1]+g_I[i-aux]+g_I[i-1-aux]+g_I[i+1-aux]+g_I[i+aux]+g_I[i-1+aux]+g_I[i+1+aux])/9;
			b_I[i] = (double)(b_I[i]+b_I[i-1]+b_I[i+1]+b_I[i-aux]+b_I[i-1-aux]+b_I[i+1-aux]+b_I[i+aux]+b_I[i-1+aux]+b_I[i+1+aux])/9;
	   }
	if(  nrows == 5){
	r_I[i] = (r_I[i]+r_I[i-1]+r_I[i-2]+r_I[i+1]+r_I[i+2]+
            r_I[i-aux]+r_I[i-1-aux]+r_I[i-2-aux]+r_I[i+1-aux]+r_I[i+2-aux]+
            r_I[i-(aux*2)]+r_I[i-1-(aux*2)]+r_I[i-2-(aux*2)]+r_I[i+1-(aux*2)]+r_I[i+2-(aux*2)]+
            r_I[i+aux]+r_I[i-1+aux]+r_I[i-2+aux]+r_I[i+1+aux]+r_I[i+2+aux]+
            r_I[i+(aux*2)]+r_I[i-1+(aux*2)]+r_I[i-2+(aux*2)]+r_I[i+1+(aux*2)]+r_I[i+2+(aux*2)])/25;
        g_I[i] = (g_I[i]+g_I[i-1]+g_I[i-2]+g_I[i+1]+g_I[i+2]+
            g_I[i-aux]+g_I[i-1-aux]+g_I[i-2-aux]+g_I[i+1-aux]+g_I[i+2-aux]+
            g_I[i-(aux*2)]+g_I[i-1-(aux*2)]+g_I[i-2-(aux*2)]+g_I[i+1-(aux*2)]+g_I[i+2-(aux*2)]+
            g_I[i+aux]+g_I[i-1+aux]+g_I[i-2+aux]+g_I[i+1+aux]+g_I[i+2+aux]+
            g_I[i+(aux*2)]+g_I[i-1+(aux*2)]+g_I[i-2+(aux*2)]+g_I[i+1+(aux*2)]+g_I[i+2+(aux*2)])/25;
        b_I[i] = (b_I[i]+b_I[i-1]+b_I[i-2]+b_I[i+1]+b_I[i+2]+
            b_I[i-aux]+b_I[i-1-aux]+b_I[i-2-aux]+b_I[i+1-aux]+b_I[i+2-aux]+
            b_I[i-(aux*2)]+b_I[i-1-(aux*2)]+b_I[i-2-(aux*2)]+b_I[i+1-(aux*2)]+b_I[i+2-(aux*2)]+
            b_I[i+aux]+b_I[i-1+aux]+b_I[i-2+aux]+b_I[i+1+aux]+b_I[i+2+aux]+
            b_I[i+(aux*2)]+b_I[i-1+(aux*2)]+b_I[i-2+(aux*2)]+b_I[i+1+(aux*2)]+b_I[i+2+(aux*2)])/25;
   	 }

	if(  nrows == 7){
	r_I[i] = (r_I[i]+r_I[i-1]+r_I[i-2]+r_I[i-3]+r_I[i+1]+r_I[i+2]+r_I[i+3]+
            r_I[i-aux]+r_I[i-1-aux]+r_I[i-2-aux]+r_I[i-3-aux]+r_I[i+1-aux]+r_I[i+2-aux]+r_I[i+3-aux]+
            r_I[i-(aux*2)]+r_I[i-1-(aux*2)]+r_I[i-2-(aux*2)]+r_I[i-3-(aux*2)]+r_I[i+1-(aux*2)]+r_I[i+2-(aux*2)]+r_I[i+3-(aux*2)]+
            r_I[i-(aux*3)]+r_I[i-1-(aux*3)]+r_I[i-2-(aux*3)]+r_I[i-3-(aux*3)]+r_I[i+1-(aux*3)]+r_I[i+2-(aux*3)]+r_I[i+3-(aux*3)]+
            r_I[i+aux]+r_I[i-1+aux]+r_I[i-2+aux]+r_I[i-3+aux]+r_I[i+1+aux]+r_I[i+2+aux]+r_I[i+3+aux]+
            r_I[i+(aux*2)]+r_I[i-1+(aux*2)]+r_I[i-2+(aux*2)]+r_I[i-3+(aux*2)]+r_I[i+1+(aux*2)]+r_I[i+2+(aux*2)]+r_I[i+3+(aux*2)]+
            r_I[i+(aux*3)]+r_I[i-1+(aux*3)]+r_I[i-2+(aux*3)]+r_I[i-3+(aux*3)]+r_I[i+1+(aux*3)]+r_I[i+2+(aux*3)]+r_I[i+3+(aux*3)])/49;
        g_I[i] = (g_I[i]+g_I[i-1]+g_I[i-2]+g_I[i-3]+g_I[i+1]+g_I[i+2]+g_I[i+3]+
            g_I[i-aux]+g_I[i-1-aux]+g_I[i-2-aux]+g_I[i-3-aux]+g_I[i+1-aux]+g_I[i+2-aux]+g_I[i+3-aux]+
            g_I[i-(aux*2)]+g_I[i-1-(aux*2)]+g_I[i-2-(aux*2)]+g_I[i-3-(aux*2)]+g_I[i+1-(aux*2)]+g_I[i+2-(aux*2)]+g_I[i+3-(aux*2)]+
            g_I[i-(aux*3)]+g_I[i-1-(aux*3)]+g_I[i-2-(aux*3)]+g_I[i-3-(aux*3)]+g_I[i+1-(aux*3)]+g_I[i+2-(aux*3)]+g_I[i+3-(aux*3)]+
            g_I[i+aux]+g_I[i-1+aux]+g_I[i-2+aux]+g_I[i-3+aux]+g_I[i+1+aux]+g_I[i+2+aux]+g_I[i+3+aux]+
            g_I[i+(aux*2)]+g_I[i-1+(aux*2)]+g_I[i-2+(aux*2)]+g_I[i-3+(aux*2)]+g_I[i+1+(aux*2)]+g_I[i+2+(aux*2)]+g_I[i+3+(aux*2)]+
            g_I[i+(aux*3)]+g_I[i-1+(aux*3)]+g_I[i-2+(aux*3)]+g_I[i-3+(aux*3)]+g_I[i+1+(aux*3)]+g_I[i+2+(aux*3)]+g_I[i+3+(aux*3)])/49;
        b_I[i] = (b_I[i]+b_I[i-1]+b_I[i-2]+b_I[i-3]+b_I[i+1]+b_I[i+2]+b_I[i+3]+
            b_I[i-aux]+b_I[i-1-aux]+b_I[i-2-aux]+b_I[i-3-aux]+b_I[i+1-aux]+b_I[i+2-aux]+b_I[i+3-aux]+
            b_I[i-(aux*2)]+b_I[i-1-(aux*2)]+b_I[i-2-(aux*2)]+b_I[i-3-(aux*2)]+b_I[i+1-(aux*2)]+b_I[i+2-(aux*2)]+b_I[i+3-(aux*2)]+
            b_I[i-(aux*3)]+b_I[i-1-(aux*3)]+b_I[i-2-(aux*3)]+b_I[i-3-(aux*3)]+b_I[i+1-(aux*3)]+b_I[i+2-(aux*3)]+b_I[i+3-(aux*3)]+
            b_I[i+aux]+b_I[i-1+aux]+b_I[i-2+aux]+b_I[i-3+aux]+b_I[i+1+aux]+b_I[i+2+aux]+b_I[i+3+aux]+
            b_I[i+(aux*2)]+b_I[i-1+(aux*2)]+b_I[i-2+(aux*2)]+b_I[i-3+(aux*2)]+b_I[i+1+(aux*2)]+b_I[i+2+(aux*2)]+b_I[i+3+(aux*2)]+
            b_I[i+(aux*3)]+b_I[i-1+(aux*3)]+b_I[i-2+(aux*3)]+b_I[i-3+(aux*3)]+b_I[i+1+(aux*3)]+b_I[i+2+(aux*3)]+b_I[i+3+(aux*3)])/49;

   	 }

	if(  nrows == 9){
			


	r_I[i] = ( r_I[i]+r_I[i-1]+r_I[i-2]+r_I[i-3]+r_I[i-4]+r_I[i+1]+r_I[i+2]+r_I[i+3]+r_I[i+4]+
            r_I[i-aux]+r_I[i-1-aux]+r_I[i-2-aux]+r_I[i-3-aux]+r_I[i-4-aux]+r_I[i+1-aux]+r_I[i+2-aux]+r_I[i+3-aux]+ r_I[i+4-aux]+
     r_I[i-(aux*2)]+r_I[i-1-(aux*2)]+r_I[i-2-(aux*2)]+r_I[i-3-(aux*2)]+r_I[i-4-(aux*2)]+r_I[i+1-(aux*2)]+r_I[i+2-(aux*2)]+r_I[i+3-(aux*2)]+r_I[i+4-(aux*2)]+
            r_I[i-(aux*3)]+r_I[i-1-(aux*3)]+r_I[i-2-(aux*3)]+r_I[i-3-(aux*3)]+r_I[i-4-(aux*3)]+r_I[i+1-(aux*3)]+r_I[i+2-(aux*3)]+r_I[i+3-(aux*3)]+r_I[i+4-(aux*3)]+
            r_I[i+aux]+r_I[i-1+aux]+r_I[i-2+aux]+r_I[i-3+aux]+r_I[i-4+aux]+r_I[i+1+aux]+r_I[i+2+aux]+r_I[i+3+aux]+r_I[i+4+aux]+
            r_I[i+(aux*2)]+r_I[i-1+(aux*2)]+r_I[i-2+(aux*2)]+r_I[i-3+(aux*2)]+r_I[i-4+(aux*2)]+r_I[i+1+(aux*2)]+r_I[i+2+(aux*2)]+r_I[i+3+(aux*2)]+r_I[i+4+(aux*2)]+
            r_I[i+(aux*3)]+r_I[i-1+(aux*3)]+r_I[i-2+(aux*3)]+r_I[i-3+(aux*3)]+r_I[i-4+(aux*3)]+r_I[i+1+(aux*3)]+r_I[i+2+(aux*3)]+r_I[i+3+(aux*3)]+r_I[i+4+(aux*3)]+
 r_I[i+(aux*4)]+r_I[i-1+(aux*4)]+r_I[i-2+(aux*4)]+r_I[i-3+(aux*4)]+r_I[i-4+(aux*4)]+r_I[i+1+(aux*4)]+r_I[i+2+(aux*4)]+r_I[i+3+(aux*4)]+r_I[i+4+(aux*4)]+ r_I[i-(aux*4)]+r_I[i-1-(aux*4)]+r_I[i-2-(aux*4)]+r_I[i-3-(aux*4)]+r_I[i-4-(aux*4)]+r_I[i+1-(aux*4)]+r_I[i+2-(aux*4)]+r_I[i+3-(aux*4)]+r_I[i+4-(aux*4)]   )/81;

	g_I[i] = (g_I[i]+g_I[i-1]+g_I[i-2]+g_I[i-3]+g_I[i-4]+g_I[i+1]+g_I[i+2]+g_I[i+3]+g_I[i+4]+
            g_I[i-aux]+g_I[i-1-aux]+g_I[i-2-aux]+g_I[i-3-aux]+g_I[i-4-aux]+g_I[i+1-aux]+g_I[i+2-aux]+g_I[i+3-aux]+g_I[i+4-aux]+
            g_I[i-(aux*2)]+g_I[i-1-(aux*2)]+g_I[i-2-(aux*2)]+g_I[i-3-(aux*2)]+g_I[i-4-(aux*2)]+g_I[i+1-(aux*2)]+g_I[i+2-(aux*2)]+g_I[i+3-(aux*2)]+g_I[i+4-(aux*2)]+
            g_I[i-(aux*3)]+g_I[i-1-(aux*3)]+g_I[i-2-(aux*3)]+g_I[i-3-(aux*3)]+g_I[i-4-(aux*3)]+g_I[i+1-(aux*3)]+g_I[i+2-(aux*3)]+g_I[i+3-(aux*3)]+g_I[i+4-(aux*3)]+
            g_I[i+aux]+g_I[i-1+aux]+g_I[i-2+aux]+g_I[i-3+aux]+g_I[i-4+aux]+g_I[i+1+aux]+g_I[i+2+aux]+g_I[i+3+aux]+g_I[i+4+aux]+
            g_I[i+(aux*2)]+g_I[i-1+(aux*2)]+g_I[i-2+(aux*2)]+g_I[i-3+(aux*2)]+g_I[i-4+(aux*2)]+g_I[i+1+(aux*2)]+g_I[i+2+(aux*2)]+g_I[i+3+(aux*2)]+g_I[i+4+(aux*2)]+
            g_I[i+(aux*3)]+g_I[i-1+(aux*3)]+g_I[i-2+(aux*3)]+g_I[i-3+(aux*3)]+g_I[i-4+(aux*3)]+g_I[i+1+(aux*3)]+g_I[i+2+(aux*3)]+g_I[i+3+(aux*3)]+g_I[i+4+(aux*3)]+
 g_I[i+(aux*4)]+g_I[i-1+(aux*4)]+g_I[i-2+(aux*4)]+g_I[i-3+(aux*4)]+g_I[i-4+(aux*4)]+g_I[i+1+(aux*4)]+g_I[i+2+(aux*4)]+g_I[i+3+(aux*4)]+g_I[i+4+(aux*4)]+ g_I[i-(aux*4)]+g_I[i-1-(aux*4)]+g_I[i-2-(aux*4)]+g_I[i-3-(aux*4)]+g_I[i-4-(aux*4)]+g_I[i+1-(aux*4)]+g_I[i+2-(aux*4)]+g_I[i+3-(aux*4)]+g_I[i+4-(aux*4)]
  )/81;
	
	b_I[i] = (b_I[i]+b_I[i-1]+b_I[i-2]+b_I[i-3]+b_I[i-4]+b_I[i+1]+b_I[i+2]+b_I[i+3]+b_I[i+4]+
            b_I[i-aux]+b_I[i-1-aux]+b_I[i-2-aux]+b_I[i-3-aux]+b_I[i-4-aux]+b_I[i+1-aux]+b_I[i+2-aux]+b_I[i+3-aux]+b_I[i+4-aux]+
            b_I[i-(aux*2)]+b_I[i-1-(aux*2)]+b_I[i-2-(aux*2)]+b_I[i-3-(aux*2)]+b_I[i-4-(aux*2)]+b_I[i+1-(aux*2)]+b_I[i+2-(aux*2)]+b_I[i+3-(aux*2)]+b_I[i+4-(aux*2)]+
            b_I[i-(aux*3)]+b_I[i-1-(aux*3)]+b_I[i-2-(aux*3)]+b_I[i-3-(aux*3)]+b_I[i-4-(aux*3)]+b_I[i+1-(aux*3)]+b_I[i+2-(aux*3)]+b_I[i+3-(aux*3)]+b_I[i+4-(aux*3)]+
            b_I[i+aux]+b_I[i-1+aux]+b_I[i-2+aux]+b_I[i-3+aux]+b_I[i-4+aux]+b_I[i+1+aux]+b_I[i+2+aux]+b_I[i+3+aux]+b_I[i+4+aux]+
            b_I[i+(aux*2)]+b_I[i-1+(aux*2)]+b_I[i-2+(aux*2)]+b_I[i-3+(aux*2)]+b_I[i-4+(aux*2)]+b_I[i+1+(aux*2)]+b_I[i+2+(aux*2)]+b_I[i+3+(aux*2)]+b_I[i+4+(aux*2)]+
            b_I[i+(aux*3)]+b_I[i-1+(aux*3)]+b_I[i-2+(aux*3)]+b_I[i-3+(aux*3)]+b_I[i-4+(aux*3)]+b_I[i+1+(aux*3)]+b_I[i+2+(aux*3)]+b_I[i+3+(aux*3)]+b_I[i+4+(aux*3)]+
 b_I[i+(aux*4)]+b_I[i-1+(aux*4)]+b_I[i-2+(aux*4)]+b_I[i-3+(aux*4)]+b_I[i-4+(aux*4)]+b_I[i+1+(aux*4)]+b_I[i+2+(aux*4)]+b_I[i+3+(aux*4)]+b_I[i+4+(aux*4)]+ b_I[i-(aux*4)]+b_I[i-1-(aux*4)]+b_I[i-2-(aux*4)]+b_I[i-3-(aux*4)]+b_I[i-4-(aux*4)]+b_I[i+1-(aux*4)]+b_I[i+2-(aux*4)]+b_I[i+3-(aux*4)]+b_I[i+4-(aux*4)]
  )/81;

	

   	 }


	if(  nrows == 11){
		r_I[i] = ( r_I[i]+r_I[i-1]+r_I[i-2]+r_I[i-3]+r_I[i-4]+r_I[i+1]+r_I[i+2]+r_I[i+3]+r_I[i+4]+r_I[i+5]+
            r_I[i-aux]+r_I[i-1-aux]+r_I[i-2-aux]+r_I[i-3-aux]+r_I[i-4-aux]+r_I[i+1-aux]+r_I[i+2-aux]+r_I[i+3-aux]+ r_I[i+4-aux]+r_I[i+5-aux]+
     r_I[i-(aux*2)]+r_I[i-1-(aux*2)]+r_I[i-2-(aux*2)]+r_I[i-3-(aux*2)]+r_I[i-4-(aux*2)]+r_I[i+1-(aux*2)]+r_I[i+2-(aux*2)]+r_I[i+3-(aux*2)]+r_I[i+4-(aux*2)]+r_I[i+5-(aux*2)]+
            r_I[i-(aux*3)]+r_I[i-1-(aux*3)]+r_I[i-2-(aux*3)]+r_I[i-3-(aux*3)]+r_I[i-4-(aux*3)]+r_I[i+1-(aux*3)]+r_I[i+2-(aux*3)]+r_I[i+3-(aux*3)]+r_I[i+4-(aux*3)]+r_I[i+5-(aux*3)]+
            r_I[i+aux]+r_I[i-1+aux]+r_I[i-2+aux]+r_I[i-3+aux]+r_I[i-4+aux]+r_I[i+1+aux]+r_I[i+2+aux]+r_I[i+3+aux]+r_I[i+4+aux]+r_I[i+5+aux]+
            r_I[i+(aux*2)]+r_I[i-1+(aux*2)]+r_I[i-2+(aux*2)]+r_I[i-3+(aux*2)]+r_I[i-4+(aux*2)]+r_I[i+1+(aux*2)]+r_I[i+2+(aux*2)]+r_I[i+3+(aux*2)]+r_I[i+4+(aux*2)]+r_I[i+5+(aux*2)]+
            r_I[i+(aux*3)]+r_I[i-1+(aux*3)]+r_I[i-2+(aux*3)]+r_I[i-3+(aux*3)]+r_I[i-4+(aux*3)]+r_I[i+1+(aux*3)]+r_I[i+2+(aux*3)]+r_I[i+3+(aux*3)]+r_I[i+4+(aux*3)]+r_I[i+5+(aux*3)]+
 r_I[i+(aux*4)]+r_I[i-1+(aux*4)]+r_I[i-2+(aux*4)]+r_I[i-3+(aux*4)]+r_I[i-4+(aux*4)]+r_I[i-5+(aux*4)]+r_I[i+1+(aux*4)]+r_I[i+2+(aux*4)]+r_I[i+3+(aux*4)]+r_I[i+4+(aux*4)] +r_I[i+5+(aux*4)]+ + r_I[i-(aux*4)]+r_I[i-1-(aux*4)]+r_I[i-2-(aux*4)]+r_I[i-3-(aux*4)]+r_I[i-4-(aux*4)]+r_I[i-5-(aux*4)]+r_I[i+1-(aux*4)]+r_I[i+2-(aux*4)]+r_I[i+3-(aux*4)]+r_I[i+4-(aux*4)] +r_I[i+5-(aux*4)]   +
 r_I[i+(aux*5)]+r_I[i-1+(aux*5)]+r_I[i-2+(aux*5)]+r_I[i-3+(aux*5)]+r_I[i-4+(aux*5)]+r_I[i-5+(aux*5)]+r_I[i+1+(aux*5)]+r_I[i+2+(aux*5)]+r_I[i+3+(aux*5)]+r_I[i+4+(aux*5)] +r_I[i+5+(aux*5)]+
r_I[i-(aux*5)]+r_I[i-1-(aux*5)]+r_I[i-2-(aux*5)]+r_I[i-3-(aux*5)]+r_I[i-4-(aux*5)]+r_I[i-5-(aux*5)]+r_I[i+1-(aux*5)]+r_I[i+2-(aux*5)]+r_I[i+3-(aux*5)]+r_I[i+4-(aux*5)] +r_I[i+5-(aux*5)]
    )/121;

	g_I[i] = ( g_I[i]+g_I[i-1]+g_I[i-2]+g_I[i-3]+g_I[i-4]+g_I[i+1]+g_I[i+2]+g_I[i+3]+g_I[i+4]+g_I[i+5]+
            g_I[i-aux]+g_I[i-1-aux]+g_I[i-2-aux]+g_I[i-3-aux]+g_I[i-4-aux]+g_I[i+1-aux]+g_I[i+2-aux]+g_I[i+3-aux]+ g_I[i+4-aux]+g_I[i+5-aux]+
     g_I[i-(aux*2)]+g_I[i-1-(aux*2)]+g_I[i-2-(aux*2)]+g_I[i-3-(aux*2)]+g_I[i-4-(aux*2)]+g_I[i+1-(aux*2)]+g_I[i+2-(aux*2)]+g_I[i+3-(aux*2)]+g_I[i+4-(aux*2)]+g_I[i+5-(aux*2)]+
            g_I[i-(aux*3)]+g_I[i-1-(aux*3)]+g_I[i-2-(aux*3)]+g_I[i-3-(aux*3)]+g_I[i-4-(aux*3)]+g_I[i+1-(aux*3)]+g_I[i+2-(aux*3)]+g_I[i+3-(aux*3)]+g_I[i+4-(aux*3)]+g_I[i+5-(aux*3)]+
            g_I[i+aux]+g_I[i-1+aux]+g_I[i-2+aux]+g_I[i-3+aux]+g_I[i-4+aux]+g_I[i+1+aux]+g_I[i+2+aux]+g_I[i+3+aux]+g_I[i+4+aux]+g_I[i+5+aux]+
            g_I[i+(aux*2)]+g_I[i-1+(aux*2)]+g_I[i-2+(aux*2)]+g_I[i-3+(aux*2)]+g_I[i-4+(aux*2)]+g_I[i+1+(aux*2)]+g_I[i+2+(aux*2)]+g_I[i+3+(aux*2)]+g_I[i+4+(aux*2)]+g_I[i+5+(aux*2)]+
            g_I[i+(aux*3)]+g_I[i-1+(aux*3)]+g_I[i-2+(aux*3)]+g_I[i-3+(aux*3)]+g_I[i-4+(aux*3)]+g_I[i+1+(aux*3)]+g_I[i+2+(aux*3)]+g_I[i+3+(aux*3)]+g_I[i+4+(aux*3)]+g_I[i+5+(aux*3)]+
 g_I[i+(aux*4)]+g_I[i-1+(aux*4)]+g_I[i-2+(aux*4)]+g_I[i-3+(aux*4)]+g_I[i-4+(aux*4)]+g_I[i-5+(aux*4)]+g_I[i+1+(aux*4)]+g_I[i+2+(aux*4)]+g_I[i+3+(aux*4)]+g_I[i+4+(aux*4)] +g_I[i+5+(aux*4)]+ + g_I[i-(aux*4)]+g_I[i-1-(aux*4)]+g_I[i-2-(aux*4)]+g_I[i-3-(aux*4)]+g_I[i-4-(aux*4)]+g_I[i-5-(aux*4)]+g_I[i+1-(aux*4)]+g_I[i+2-(aux*4)]+g_I[i+3-(aux*4)]+g_I[i+4-(aux*4)] +g_I[i+5-(aux*4)]   +
 g_I[i+(aux*5)]+g_I[i-1+(aux*5)]+g_I[i-2+(aux*5)]+g_I[i-3+(aux*5)]+g_I[i-4+(aux*5)]+g_I[i-5+(aux*5)]+g_I[i+1+(aux*5)]+g_I[i+2+(aux*5)]+g_I[i+3+(aux*5)]+g_I[i+4+(aux*5)] +g_I[i+5+(aux*5)]+
g_I[i-(aux*5)]+g_I[i-1-(aux*5)]+g_I[i-2-(aux*5)]+g_I[i-3-(aux*5)]+g_I[i-4-(aux*5)]+g_I[i-5-(aux*5)]+g_I[i+1-(aux*5)]+g_I[i+2-(aux*5)]+g_I[i+3-(aux*5)]+g_I[i+4-(aux*5)] +g_I[i+5-(aux*5)]
    )/121;
	
b_I[i] = ( b_I[i]+b_I[i-1]+b_I[i-2]+b_I[i-3]+b_I[i-4]+b_I[i+1]+b_I[i+2]+b_I[i+3]+b_I[i+4]+b_I[i+5]+
            b_I[i-aux]+b_I[i-1-aux]+b_I[i-2-aux]+b_I[i-3-aux]+b_I[i-4-aux]+b_I[i+1-aux]+b_I[i+2-aux]+b_I[i+3-aux]+ b_I[i+4-aux]+b_I[i+5-aux]+
     b_I[i-(aux*2)]+b_I[i-1-(aux*2)]+b_I[i-2-(aux*2)]+b_I[i-3-(aux*2)]+b_I[i-4-(aux*2)]+b_I[i+1-(aux*2)]+b_I[i+2-(aux*2)]+b_I[i+3-(aux*2)]+b_I[i+4-(aux*2)]+b_I[i+5-(aux*2)]+
            b_I[i-(aux*3)]+b_I[i-1-(aux*3)]+b_I[i-2-(aux*3)]+b_I[i-3-(aux*3)]+b_I[i-4-(aux*3)]+b_I[i+1-(aux*3)]+b_I[i+2-(aux*3)]+b_I[i+3-(aux*3)]+b_I[i+4-(aux*3)]+b_I[i+5-(aux*3)]+
            b_I[i+aux]+b_I[i-1+aux]+b_I[i-2+aux]+b_I[i-3+aux]+b_I[i-4+aux]+b_I[i+1+aux]+b_I[i+2+aux]+b_I[i+3+aux]+b_I[i+4+aux]+b_I[i+5+aux]+
            b_I[i+(aux*2)]+b_I[i-1+(aux*2)]+b_I[i-2+(aux*2)]+b_I[i-3+(aux*2)]+b_I[i-4+(aux*2)]+b_I[i+1+(aux*2)]+b_I[i+2+(aux*2)]+b_I[i+3+(aux*2)]+b_I[i+4+(aux*2)]+b_I[i+5+(aux*2)]+
            b_I[i+(aux*3)]+b_I[i-1+(aux*3)]+b_I[i-2+(aux*3)]+b_I[i-3+(aux*3)]+b_I[i-4+(aux*3)]+b_I[i+1+(aux*3)]+b_I[i+2+(aux*3)]+b_I[i+3+(aux*3)]+b_I[i+4+(aux*3)]+b_I[i+5+(aux*3)]+
 b_I[i+(aux*4)]+b_I[i-1+(aux*4)]+b_I[i-2+(aux*4)]+b_I[i-3+(aux*4)]+b_I[i-4+(aux*4)]+b_I[i-5+(aux*4)]+b_I[i+1+(aux*4)]+b_I[i+2+(aux*4)]+b_I[i+3+(aux*4)]+b_I[i+4+(aux*4)] +b_I[i+5+(aux*4)]+ + b_I[i-(aux*4)]+b_I[i-1-(aux*4)]+b_I[i-2-(aux*4)]+b_I[i-3-(aux*4)]+b_I[i-4-(aux*4)]+b_I[i-5-(aux*4)]+b_I[i+1-(aux*4)]+b_I[i+2-(aux*4)]+b_I[i+3-(aux*4)]+b_I[i+4-(aux*4)] +b_I[i+5-(aux*4)]   +
 b_I[i+(aux*5)]+b_I[i-1+(aux*5)]+b_I[i-2+(aux*5)]+b_I[i-3+(aux*5)]+b_I[i-4+(aux*5)]+b_I[i-5+(aux*5)]+b_I[i+1+(aux*5)]+b_I[i+2+(aux*5)]+b_I[i+3+(aux*5)]+b_I[i+4+(aux*5)] +b_I[i+5+(aux*5)]+
b_I[i-(aux*5)]+b_I[i-1-(aux*5)]+b_I[i-2-(aux*5)]+b_I[i-3-(aux*5)]+b_I[i-4-(aux*5)]+b_I[i-5-(aux*5)]+b_I[i+1-(aux*5)]+b_I[i+2-(aux*5)]+b_I[i+3-(aux*5)]+b_I[i+4-(aux*5)] +b_I[i+5-(aux*5)]
    )/121;


   	 }

	if(  nrows == 13){
		r_I[i] = ( r_I[i]+r_I[i-1]+r_I[i-2]+r_I[i-3]+r_I[i-4]+r_I[i+1]+r_I[i+2]+r_I[i+3]+r_I[i+4]+r_I[i+5]+r_I[i+6]+
            r_I[i-aux]+r_I[i-1-aux]+r_I[i-2-aux]+r_I[i-3-aux]+r_I[i-4-aux]+r_I[i+1-aux]+r_I[i+2-aux]+r_I[i+3-aux]+ r_I[i+4-aux]+r_I[i+5-aux]+r_I[i+6-aux]+
     r_I[i-(aux*2)]+r_I[i-1-(aux*2)]+r_I[i-2-(aux*2)]+r_I[i-3-(aux*2)]+r_I[i-4-(aux*2)]+r_I[i+1-(aux*2)]+r_I[i+2-(aux*2)]+r_I[i+3-(aux*2)]+r_I[i+4-(aux*2)]+r_I[i+5-(aux*2)]+r_I[i+6-(aux*2)]+
            r_I[i-(aux*3)]+r_I[i-1-(aux*3)]+r_I[i-2-(aux*3)]+r_I[i-3-(aux*3)]+r_I[i-4-(aux*3)]+r_I[i+1-(aux*3)]+r_I[i+2-(aux*3)]+r_I[i+3-(aux*3)]+r_I[i+4-(aux*3)]+r_I[i+5-(aux*3)]+r_I[i+6-(aux*3)]+
            r_I[i+aux]+r_I[i-1+aux]+r_I[i-2+aux]+r_I[i-3+aux]+r_I[i-4+aux]+r_I[i+1+aux]+r_I[i+2+aux]+r_I[i+3+aux]+r_I[i+4+aux]+r_I[i+5+aux]+r_I[i+6+aux]+
            r_I[i+(aux*2)]+r_I[i-1+(aux*2)]+r_I[i-2+(aux*2)]+r_I[i-3+(aux*2)]+r_I[i-4+(aux*2)]+r_I[i+1+(aux*2)]+r_I[i+2+(aux*2)]+r_I[i+3+(aux*2)]+r_I[i+4+(aux*2)]+r_I[i+5+(aux*2)]+r_I[i+6+(aux*2)]+
            r_I[i+(aux*3)]+r_I[i-1+(aux*3)]+r_I[i-2+(aux*3)]+r_I[i-3+(aux*3)]+r_I[i-4+(aux*3)]+r_I[i+1+(aux*3)]+r_I[i+2+(aux*3)]+r_I[i+3+(aux*3)]+r_I[i+4+(aux*3)]+r_I[i+5+(aux*3)]+r_I[i+6+(aux*3)]+
 r_I[i+(aux*4)]+r_I[i-1+(aux*4)]+r_I[i-2+(aux*4)]+r_I[i-3+(aux*4)]+r_I[i-4+(aux*4)]+r_I[i-5+(aux*4)]+r_I[i-6+(aux*4)]
+r_I[i+1+(aux*4)]+r_I[i+2+(aux*4)]+r_I[i+3+(aux*4)]+r_I[i+4+(aux*4)] +r_I[i+5+(aux*4)] +r_I[i+6+(aux*4)]
+ r_I[i-(aux*4)]+r_I[i-1-(aux*4)]+r_I[i-2-(aux*4)]+r_I[i-3-(aux*4)]+r_I[i-4-(aux*4)]+r_I[i-5-(aux*4)]+r_I[i-6-(aux*4)]
+r_I[i+1-(aux*4)]+r_I[i+2-(aux*4)]+r_I[i+3-(aux*4)]+r_I[i+4-(aux*4)] +r_I[i+5-(aux*4)] +r_I[i+6-(aux*4)]  +
 r_I[i+(aux*5)]+r_I[i-1+(aux*5)]+r_I[i-2+(aux*5)]+r_I[i-3+(aux*5)]+r_I[i-4+(aux*5)]+r_I[i-5+(aux*5)]+r_I[i-6+(aux*5)]
+r_I[i+1+(aux*5)]+r_I[i+2+(aux*5)]+r_I[i+3+(aux*5)]+r_I[i+4+(aux*5)] +r_I[i+5+(aux*5)]+r_I[i+6+(aux*5)]
+ r_I[i-(aux*5)]+r_I[i-1-(aux*5)]+r_I[i-2-(aux*5)]+r_I[i-3-(aux*5)]+r_I[i-4-(aux*5)]+r_I[i-5-(aux*5)]+r_I[i+1-(aux*5)]+r_I[i+2-(aux*5)]+r_I[i+3-(aux*5)]+r_I[i+4-(aux*5)] +r_I[i+5-(aux*5)]+r_I[i+6-(aux*5)]+
r_I[i+(aux*5)]+r_I[i-1+(aux*5)]+r_I[i-2+(aux*5)]+r_I[i-3+(aux*5)]+r_I[i-4+(aux*5)]+r_I[i-5+(aux*5)]+r_I[i-6+(aux*5)]
+r_I[i+1+(aux*6)]+r_I[i+2+(aux*6)]+r_I[i+3+(aux*6)]+r_I[i+4+(aux*6)] +r_I[i+5+(aux*6)]+r_I[i+6+(aux*6)]
+ r_I[i-(aux*6)]+r_I[i-1-(aux*6)]+r_I[i-2-(aux*6)]+r_I[i-3-(aux*6)]+r_I[i-4-(aux*6)]+r_I[i-5-(aux*6)]+r_I[i+1-(aux*6)]+r_I[i+2-(aux*6)]+r_I[i+3-(aux*6)]+r_I[i+4-(aux*6)] +r_I[i+5-(aux*6)]+r_I[i+6-(aux*6)]
    )/169;

	g_I[i] = ( g_I[i]+g_I[i-1]+g_I[i-2]+g_I[i-3]+g_I[i-4]+g_I[i+1]+g_I[i+2]+g_I[i+3]+g_I[i+4]+g_I[i+5]+g_I[i+6]+
            g_I[i-aux]+g_I[i-1-aux]+g_I[i-2-aux]+g_I[i-3-aux]+g_I[i-4-aux]+g_I[i+1-aux]+g_I[i+2-aux]+g_I[i+3-aux]+ g_I[i+4-aux]+g_I[i+5-aux]+g_I[i+6-aux]+
     g_I[i-(aux*2)]+g_I[i-1-(aux*2)]+g_I[i-2-(aux*2)]+g_I[i-3-(aux*2)]+g_I[i-4-(aux*2)]+g_I[i+1-(aux*2)]+g_I[i+2-(aux*2)]+g_I[i+3-(aux*2)]+g_I[i+4-(aux*2)]+g_I[i+5-(aux*2)]+g_I[i+6-(aux*2)]+
            g_I[i-(aux*3)]+g_I[i-1-(aux*3)]+g_I[i-2-(aux*3)]+g_I[i-3-(aux*3)]+g_I[i-4-(aux*3)]+g_I[i+1-(aux*3)]+g_I[i+2-(aux*3)]+g_I[i+3-(aux*3)]+g_I[i+4-(aux*3)]+g_I[i+5-(aux*3)]+g_I[i+6-(aux*3)]+
            g_I[i+aux]+g_I[i-1+aux]+g_I[i-2+aux]+g_I[i-3+aux]+g_I[i-4+aux]+g_I[i+1+aux]+g_I[i+2+aux]+g_I[i+3+aux]+g_I[i+4+aux]+g_I[i+5+aux]+g_I[i+6+aux]+
            g_I[i+(aux*2)]+g_I[i-1+(aux*2)]+g_I[i-2+(aux*2)]+g_I[i-3+(aux*2)]+g_I[i-4+(aux*2)]+g_I[i+1+(aux*2)]+g_I[i+2+(aux*2)]+g_I[i+3+(aux*2)]+g_I[i+4+(aux*2)]+g_I[i+5+(aux*2)]+g_I[i+6+(aux*2)]+
            g_I[i+(aux*3)]+g_I[i-1+(aux*3)]+g_I[i-2+(aux*3)]+g_I[i-3+(aux*3)]+g_I[i-4+(aux*3)]+g_I[i+1+(aux*3)]+g_I[i+2+(aux*3)]+g_I[i+3+(aux*3)]+g_I[i+4+(aux*3)]+g_I[i+5+(aux*3)]+g_I[i+6+(aux*3)]+
 g_I[i+(aux*4)]+g_I[i-1+(aux*4)]+g_I[i-2+(aux*4)]+g_I[i-3+(aux*4)]+g_I[i-4+(aux*4)]+g_I[i-5+(aux*4)]+g_I[i-6+(aux*4)]
+g_I[i+1+(aux*4)]+g_I[i+2+(aux*4)]+g_I[i+3+(aux*4)]+g_I[i+4+(aux*4)] +g_I[i+5+(aux*4)] +g_I[i+6+(aux*4)]
+ g_I[i-(aux*4)]+g_I[i-1-(aux*4)]+g_I[i-2-(aux*4)]+g_I[i-3-(aux*4)]+g_I[i-4-(aux*4)]+g_I[i-5-(aux*4)]+g_I[i-6-(aux*4)]
+g_I[i+1-(aux*4)]+g_I[i+2-(aux*4)]+g_I[i+3-(aux*4)]+g_I[i+4-(aux*4)] +g_I[i+5-(aux*4)] +g_I[i+6-(aux*4)]  +
 g_I[i+(aux*5)]+g_I[i-1+(aux*5)]+g_I[i-2+(aux*5)]+g_I[i-3+(aux*5)]+g_I[i-4+(aux*5)]+g_I[i-5+(aux*5)]+g_I[i-6+(aux*5)]
+g_I[i+1+(aux*5)]+g_I[i+2+(aux*5)]+g_I[i+3+(aux*5)]+g_I[i+4+(aux*5)] +g_I[i+5+(aux*5)]+g_I[i+6+(aux*5)]
+ g_I[i-(aux*5)]+g_I[i-1-(aux*5)]+g_I[i-2-(aux*5)]+g_I[i-3-(aux*5)]+g_I[i-4-(aux*5)]+g_I[i-5-(aux*5)]+g_I[i+1-(aux*5)]+g_I[i+2-(aux*5)]+g_I[i+3-(aux*5)]+g_I[i+4-(aux*5)] +g_I[i+5-(aux*5)]+g_I[i+6-(aux*5)]+
g_I[i+(aux*5)]+g_I[i-1+(aux*5)]+g_I[i-2+(aux*5)]+g_I[i-3+(aux*5)]+g_I[i-4+(aux*5)]+g_I[i-5+(aux*5)]+g_I[i-6+(aux*5)]
+g_I[i+1+(aux*6)]+g_I[i+2+(aux*6)]+g_I[i+3+(aux*6)]+g_I[i+4+(aux*6)] +g_I[i+5+(aux*6)]+g_I[i+6+(aux*6)]
+ g_I[i-(aux*6)]+g_I[i-1-(aux*6)]+g_I[i-2-(aux*6)]+g_I[i-3-(aux*6)]+g_I[i-4-(aux*6)]+g_I[i-5-(aux*6)]+g_I[i+1-(aux*6)]+g_I[i+2-(aux*6)]+g_I[i+3-(aux*6)]+g_I[i+4-(aux*6)] +g_I[i+5-(aux*6)]+g_I[i+6-(aux*6)]
    )/169;


	b_I[i] = ( b_I[i]+b_I[i-1]+b_I[i-2]+b_I[i-3]+b_I[i-4]+b_I[i+1]+b_I[i+2]+b_I[i+3]+b_I[i+4]+b_I[i+5]+b_I[i+6]+
            b_I[i-aux]+b_I[i-1-aux]+b_I[i-2-aux]+b_I[i-3-aux]+b_I[i-4-aux]+b_I[i+1-aux]+b_I[i+2-aux]+b_I[i+3-aux]+ b_I[i+4-aux]+b_I[i+5-aux]+b_I[i+6-aux]+
     b_I[i-(aux*2)]+b_I[i-1-(aux*2)]+b_I[i-2-(aux*2)]+b_I[i-3-(aux*2)]+b_I[i-4-(aux*2)]+b_I[i+1-(aux*2)]+b_I[i+2-(aux*2)]+b_I[i+3-(aux*2)]+b_I[i+4-(aux*2)]+b_I[i+5-(aux*2)]+b_I[i+6-(aux*2)]+
            b_I[i-(aux*3)]+b_I[i-1-(aux*3)]+b_I[i-2-(aux*3)]+b_I[i-3-(aux*3)]+b_I[i-4-(aux*3)]+b_I[i+1-(aux*3)]+b_I[i+2-(aux*3)]+b_I[i+3-(aux*3)]+b_I[i+4-(aux*3)]+b_I[i+5-(aux*3)]+b_I[i+6-(aux*3)]+
            b_I[i+aux]+b_I[i-1+aux]+b_I[i-2+aux]+b_I[i-3+aux]+b_I[i-4+aux]+b_I[i+1+aux]+b_I[i+2+aux]+b_I[i+3+aux]+b_I[i+4+aux]+b_I[i+5+aux]+b_I[i+6+aux]+
            b_I[i+(aux*2)]+b_I[i-1+(aux*2)]+b_I[i-2+(aux*2)]+b_I[i-3+(aux*2)]+b_I[i-4+(aux*2)]+b_I[i+1+(aux*2)]+b_I[i+2+(aux*2)]+b_I[i+3+(aux*2)]+b_I[i+4+(aux*2)]+b_I[i+5+(aux*2)]+b_I[i+6+(aux*2)]+
            b_I[i+(aux*3)]+b_I[i-1+(aux*3)]+b_I[i-2+(aux*3)]+b_I[i-3+(aux*3)]+b_I[i-4+(aux*3)]+b_I[i+1+(aux*3)]+b_I[i+2+(aux*3)]+b_I[i+3+(aux*3)]+b_I[i+4+(aux*3)]+b_I[i+5+(aux*3)]+b_I[i+6+(aux*3)]+
 b_I[i+(aux*4)]+b_I[i-1+(aux*4)]+b_I[i-2+(aux*4)]+b_I[i-3+(aux*4)]+b_I[i-4+(aux*4)]+b_I[i-5+(aux*4)]+b_I[i-6+(aux*4)]
+b_I[i+1+(aux*4)]+b_I[i+2+(aux*4)]+b_I[i+3+(aux*4)]+b_I[i+4+(aux*4)] +b_I[i+5+(aux*4)] +b_I[i+6+(aux*4)]
+ b_I[i-(aux*4)]+b_I[i-1-(aux*4)]+b_I[i-2-(aux*4)]+b_I[i-3-(aux*4)]+b_I[i-4-(aux*4)]+b_I[i-5-(aux*4)]+b_I[i-6-(aux*4)]
+b_I[i+1-(aux*4)]+b_I[i+2-(aux*4)]+b_I[i+3-(aux*4)]+b_I[i+4-(aux*4)] +b_I[i+5-(aux*4)] +b_I[i+6-(aux*4)]  +
 b_I[i+(aux*5)]+b_I[i-1+(aux*5)]+b_I[i-2+(aux*5)]+b_I[i-3+(aux*5)]+b_I[i-4+(aux*5)]+b_I[i-5+(aux*5)]+b_I[i-6+(aux*5)]
+b_I[i+1+(aux*5)]+b_I[i+2+(aux*5)]+b_I[i+3+(aux*5)]+b_I[i+4+(aux*5)] +b_I[i+5+(aux*5)]+b_I[i+6+(aux*5)]
+ b_I[i-(aux*5)]+b_I[i-1-(aux*5)]+b_I[i-2-(aux*5)]+b_I[i-3-(aux*5)]+b_I[i-4-(aux*5)]+b_I[i-5-(aux*5)]+b_I[i+1-(aux*5)]+b_I[i+2-(aux*5)]+b_I[i+3-(aux*5)]+b_I[i+4-(aux*5)] +b_I[i+5-(aux*5)]+b_I[i+6-(aux*5)]+
b_I[i+(aux*5)]+b_I[i-1+(aux*5)]+b_I[i-2+(aux*5)]+b_I[i-3+(aux*5)]+b_I[i-4+(aux*5)]+b_I[i-5+(aux*5)]+b_I[i-6+(aux*5)]
+b_I[i+1+(aux*6)]+b_I[i+2+(aux*6)]+b_I[i+3+(aux*6)]+b_I[i+4+(aux*6)] +b_I[i+5+(aux*6)]+b_I[i+6+(aux*6)]
+ b_I[i-(aux*6)]+b_I[i-1-(aux*6)]+b_I[i-2-(aux*6)]+b_I[i-3-(aux*6)]+b_I[i-4-(aux*6)]+b_I[i-5-(aux*6)]+b_I[i+1-(aux*6)]+b_I[i+2-(aux*6)]+b_I[i+3-(aux*6)]+b_I[i+4-(aux*6)] +b_I[i+5-(aux*6)]+b_I[i+6-(aux*6)]
    )/169;



   	 }


	if(  nrows == 15){
		r_I[i] = ( r_I[i]+r_I[i-1]+r_I[i-2]+r_I[i-3]+r_I[i-4]+r_I[i+1]+r_I[i+2]+r_I[i+3]+r_I[i+4]+r_I[i+5]+r_I[i+6]+r_I[i+7]+
            r_I[i-aux]+r_I[i-1-aux]+r_I[i-2-aux]+r_I[i-3-aux]+r_I[i-4-aux]+r_I[i+1-aux]+r_I[i+2-aux]+r_I[i+3-aux]+ r_I[i+4-aux]+r_I[i+5-aux]+r_I[i+6-aux]+r_I[i+7-aux]+
     r_I[i-(aux*2)]+r_I[i-1-(aux*2)]+r_I[i-2-(aux*2)]+r_I[i-3-(aux*2)]+r_I[i-4-(aux*2)]+r_I[i+1-(aux*2)]+r_I[i+2-(aux*2)]+r_I[i+3-(aux*2)]+r_I[i+4-(aux*2)]+r_I[i+5-(aux*2)]+r_I[i+6-(aux*2)]+r_I[i+7-(aux*2)]+
            r_I[i-(aux*3)]+r_I[i-1-(aux*3)]+r_I[i-2-(aux*3)]+r_I[i-3-(aux*3)]+r_I[i-4-(aux*3)]+r_I[i+1-(aux*3)]+r_I[i+2-(aux*3)]+r_I[i+3-(aux*3)]+r_I[i+4-(aux*3)]+r_I[i+5-(aux*3)]+r_I[i+6-(aux*3)]+r_I[i+7-(aux*3)]+
            r_I[i+aux]+r_I[i-1+aux]+r_I[i-2+aux]+r_I[i-3+aux]+r_I[i-4+aux]+r_I[i+1+aux]+r_I[i+2+aux]+r_I[i+3+aux]+r_I[i+4+aux]+r_I[i+5+aux]+r_I[i+6+aux]+r_I[i+7+aux]+
            r_I[i+(aux*2)]+r_I[i-1+(aux*2)]+r_I[i-2+(aux*2)]+r_I[i-3+(aux*2)]+r_I[i-4+(aux*2)]+r_I[i+1+(aux*2)]+r_I[i+2+(aux*2)]+r_I[i+3+(aux*2)]+r_I[i+4+(aux*2)]+r_I[i+5+(aux*2)]+r_I[i+6+(aux*2)]+r_I[i+7+(aux*2)]+
            r_I[i+(aux*3)]+r_I[i-1+(aux*3)]+r_I[i-2+(aux*3)]+r_I[i-3+(aux*3)]+r_I[i-4+(aux*3)]+r_I[i+1+(aux*3)]+r_I[i+2+(aux*3)]+r_I[i+3+(aux*3)]+r_I[i+4+(aux*3)]+r_I[i+5+(aux*3)]+r_I[i+6+(aux*3)]+r_I[i+7+(aux*3)]+
 r_I[i+(aux*4)]+r_I[i-1+(aux*4)]+r_I[i-2+(aux*4)]+r_I[i-3+(aux*4)]+r_I[i-4+(aux*4)]+r_I[i-5+(aux*4)]+r_I[i-6+(aux*4)]+r_I[i-7+(aux*4)]
+r_I[i+1+(aux*4)]+r_I[i+2+(aux*4)]+r_I[i+3+(aux*4)]+r_I[i+4+(aux*4)] +r_I[i+5+(aux*4)] +r_I[i+6+(aux*4)]
+ r_I[i-(aux*4)]+r_I[i-1-(aux*4)]+r_I[i-2-(aux*4)]+r_I[i-3-(aux*4)]+r_I[i-4-(aux*4)]+r_I[i-5-(aux*4)]+r_I[i-6-(aux*4)]+r_I[i-7-(aux*4)]
+r_I[i+1-(aux*4)]+r_I[i+2-(aux*4)]+r_I[i+3-(aux*4)]+r_I[i+4-(aux*4)] +r_I[i+5-(aux*4)] +r_I[i+6-(aux*4)] +r_I[i+7-(aux*4)]  +
 r_I[i+(aux*5)]+r_I[i-1+(aux*5)]+r_I[i-2+(aux*5)]+r_I[i-3+(aux*5)]+r_I[i-4+(aux*5)]+r_I[i-5+(aux*5)]+r_I[i-6+(aux*5)]+r_I[i-7+(aux*5)]
+r_I[i+1+(aux*5)]+r_I[i+2+(aux*5)]+r_I[i+3+(aux*5)]+r_I[i+4+(aux*5)] +r_I[i+5+(aux*5)]+r_I[i+6+(aux*5)]+r_I[i+7+(aux*5)]
+ r_I[i-(aux*5)]+r_I[i-1-(aux*5)]+r_I[i-2-(aux*5)]+r_I[i-3-(aux*5)]+r_I[i-4-(aux*5)]+r_I[i-5-(aux*5)]+r_I[i+1-(aux*5)]+r_I[i+2-(aux*5)]+r_I[i+3-(aux*5)]+r_I[i+4-(aux*5)] +r_I[i+5-(aux*5)]+r_I[i+6-(aux*5)]+r_I[i+7-(aux*5)]+
r_I[i+(aux*5)]+r_I[i-1+(aux*5)]+r_I[i-2+(aux*5)]+r_I[i-3+(aux*5)]+r_I[i-4+(aux*5)]+r_I[i-5+(aux*5)]+r_I[i-6+(aux*5)]+r_I[i-7+(aux*5)]
+r_I[i+1+(aux*6)]+r_I[i+2+(aux*6)]+r_I[i+3+(aux*6)]+r_I[i+4+(aux*6)] +r_I[i+5+(aux*6)]+r_I[i+6+(aux*6)]+r_I[i+7+(aux*6)]
+ r_I[i-(aux*6)]+r_I[i-1-(aux*6)]+r_I[i-2-(aux*6)]+r_I[i-3-(aux*6)]+r_I[i-4-(aux*6)]+r_I[i-5-(aux*6)]+r_I[i+1-(aux*6)]+r_I[i+2-(aux*6)]+r_I[i+3-(aux*6)]+r_I[i+4-(aux*6)] +r_I[i+5-(aux*6)]+r_I[i+6-(aux*6)]+r_I[i+7-(aux*6)]

+r_I[i+1+(aux*7)]+r_I[i+2+(aux*7)]+r_I[i+3+(aux*7)]+r_I[i+4+(aux*7)] +r_I[i+5+(aux*7)]+r_I[i+6+(aux*7)]+r_I[i+7+(aux*7)]
+ r_I[i-(aux*7)]+r_I[i-1-(aux*7)]+r_I[i-2-(aux*7)]+r_I[i-3-(aux*7)]+r_I[i-4-(aux*7)]+r_I[i-5-(aux*7)]+r_I[i+1-(aux*7)]+r_I[i+2-(aux*7)]+r_I[i+3-(aux*7)]+r_I[i+4-(aux*7)] +r_I[i+5-(aux*7)]+r_I[i+6-(aux*7)]+r_I[i+7-(aux*7)]
    )/225;

	b_I[i] = ( b_I[i]+b_I[i-1]+b_I[i-2]+b_I[i-3]+b_I[i-4]+b_I[i+1]+b_I[i+2]+b_I[i+3]+b_I[i+4]+b_I[i+5]+b_I[i+6]+b_I[i+7]+
            b_I[i-aux]+b_I[i-1-aux]+b_I[i-2-aux]+b_I[i-3-aux]+b_I[i-4-aux]+b_I[i+1-aux]+b_I[i+2-aux]+b_I[i+3-aux]+ b_I[i+4-aux]+b_I[i+5-aux]+b_I[i+6-aux]+b_I[i+7-aux]+
     b_I[i-(aux*2)]+b_I[i-1-(aux*2)]+b_I[i-2-(aux*2)]+b_I[i-3-(aux*2)]+b_I[i-4-(aux*2)]+b_I[i+1-(aux*2)]+b_I[i+2-(aux*2)]+b_I[i+3-(aux*2)]+b_I[i+4-(aux*2)]+b_I[i+5-(aux*2)]+b_I[i+6-(aux*2)]+b_I[i+7-(aux*2)]+
            b_I[i-(aux*3)]+b_I[i-1-(aux*3)]+b_I[i-2-(aux*3)]+b_I[i-3-(aux*3)]+b_I[i-4-(aux*3)]+b_I[i+1-(aux*3)]+b_I[i+2-(aux*3)]+b_I[i+3-(aux*3)]+b_I[i+4-(aux*3)]+b_I[i+5-(aux*3)]+b_I[i+6-(aux*3)]+b_I[i+7-(aux*3)]+
            b_I[i+aux]+b_I[i-1+aux]+b_I[i-2+aux]+b_I[i-3+aux]+b_I[i-4+aux]+b_I[i+1+aux]+b_I[i+2+aux]+b_I[i+3+aux]+b_I[i+4+aux]+b_I[i+5+aux]+b_I[i+6+aux]+b_I[i+7+aux]+
            b_I[i+(aux*2)]+b_I[i-1+(aux*2)]+b_I[i-2+(aux*2)]+b_I[i-3+(aux*2)]+b_I[i-4+(aux*2)]+b_I[i+1+(aux*2)]+b_I[i+2+(aux*2)]+b_I[i+3+(aux*2)]+b_I[i+4+(aux*2)]+b_I[i+5+(aux*2)]+b_I[i+6+(aux*2)]+b_I[i+7+(aux*2)]+
            b_I[i+(aux*3)]+b_I[i-1+(aux*3)]+b_I[i-2+(aux*3)]+b_I[i-3+(aux*3)]+b_I[i-4+(aux*3)]+b_I[i+1+(aux*3)]+b_I[i+2+(aux*3)]+b_I[i+3+(aux*3)]+b_I[i+4+(aux*3)]+b_I[i+5+(aux*3)]+b_I[i+6+(aux*3)]+b_I[i+7+(aux*3)]+
 b_I[i+(aux*4)]+b_I[i-1+(aux*4)]+b_I[i-2+(aux*4)]+b_I[i-3+(aux*4)]+b_I[i-4+(aux*4)]+b_I[i-5+(aux*4)]+b_I[i-6+(aux*4)]+b_I[i-7+(aux*4)]
+b_I[i+1+(aux*4)]+b_I[i+2+(aux*4)]+b_I[i+3+(aux*4)]+b_I[i+4+(aux*4)] +b_I[i+5+(aux*4)] +b_I[i+6+(aux*4)]
+ b_I[i-(aux*4)]+b_I[i-1-(aux*4)]+b_I[i-2-(aux*4)]+b_I[i-3-(aux*4)]+b_I[i-4-(aux*4)]+b_I[i-5-(aux*4)]+b_I[i-6-(aux*4)]+b_I[i-7-(aux*4)]
+b_I[i+1-(aux*4)]+b_I[i+2-(aux*4)]+b_I[i+3-(aux*4)]+b_I[i+4-(aux*4)] +b_I[i+5-(aux*4)] +b_I[i+6-(aux*4)] +b_I[i+7-(aux*4)]  +
 b_I[i+(aux*5)]+b_I[i-1+(aux*5)]+b_I[i-2+(aux*5)]+b_I[i-3+(aux*5)]+b_I[i-4+(aux*5)]+b_I[i-5+(aux*5)]+b_I[i-6+(aux*5)]+b_I[i-7+(aux*5)]
+b_I[i+1+(aux*5)]+b_I[i+2+(aux*5)]+b_I[i+3+(aux*5)]+b_I[i+4+(aux*5)] +b_I[i+5+(aux*5)]+b_I[i+6+(aux*5)]+b_I[i+7+(aux*5)]
+ b_I[i-(aux*5)]+b_I[i-1-(aux*5)]+b_I[i-2-(aux*5)]+b_I[i-3-(aux*5)]+b_I[i-4-(aux*5)]+b_I[i-5-(aux*5)]+b_I[i+1-(aux*5)]+b_I[i+2-(aux*5)]+b_I[i+3-(aux*5)]+b_I[i+4-(aux*5)] +b_I[i+5-(aux*5)]+b_I[i+6-(aux*5)]+b_I[i+7-(aux*5)]+
b_I[i+(aux*5)]+b_I[i-1+(aux*5)]+b_I[i-2+(aux*5)]+b_I[i-3+(aux*5)]+b_I[i-4+(aux*5)]+b_I[i-5+(aux*5)]+b_I[i-6+(aux*5)]+b_I[i-7+(aux*5)]
+b_I[i+1+(aux*6)]+b_I[i+2+(aux*6)]+b_I[i+3+(aux*6)]+b_I[i+4+(aux*6)] +b_I[i+5+(aux*6)]+b_I[i+6+(aux*6)]+b_I[i+7+(aux*6)]
+ b_I[i-(aux*6)]+b_I[i-1-(aux*6)]+b_I[i-2-(aux*6)]+b_I[i-3-(aux*6)]+b_I[i-4-(aux*6)]+b_I[i-5-(aux*6)]+b_I[i+1-(aux*6)]+b_I[i+2-(aux*6)]+b_I[i+3-(aux*6)]+b_I[i+4-(aux*6)] +b_I[i+5-(aux*6)]+b_I[i+6-(aux*6)]+b_I[i+7-(aux*6)]

+b_I[i+1+(aux*7)]+b_I[i+2+(aux*7)]+b_I[i+3+(aux*7)]+b_I[i+4+(aux*7)] +b_I[i+5+(aux*7)]+b_I[i+6+(aux*7)]+b_I[i+7+(aux*7)]
+ b_I[i-(aux*7)]+b_I[i-1-(aux*7)]+b_I[i-2-(aux*7)]+b_I[i-3-(aux*7)]+b_I[i-4-(aux*7)]+b_I[i-5-(aux*7)]+b_I[i+1-(aux*7)]+b_I[i+2-(aux*7)]+b_I[i+3-(aux*7)]+b_I[i+4-(aux*7)] +b_I[i+5-(aux*7)]+b_I[i+6-(aux*7)]+b_I[i+7-(aux*7)]
    )/225;


	g_I[i] = ( g_I[i]+g_I[i-1]+g_I[i-2]+g_I[i-3]+g_I[i-4]+g_I[i+1]+g_I[i+2]+g_I[i+3]+g_I[i+4]+g_I[i+5]+g_I[i+6]+g_I[i+7]+
            g_I[i-aux]+g_I[i-1-aux]+g_I[i-2-aux]+g_I[i-3-aux]+g_I[i-4-aux]+g_I[i+1-aux]+g_I[i+2-aux]+g_I[i+3-aux]+ g_I[i+4-aux]+g_I[i+5-aux]+g_I[i+6-aux]+g_I[i+7-aux]+
     g_I[i-(aux*2)]+g_I[i-1-(aux*2)]+g_I[i-2-(aux*2)]+g_I[i-3-(aux*2)]+g_I[i-4-(aux*2)]+g_I[i+1-(aux*2)]+g_I[i+2-(aux*2)]+g_I[i+3-(aux*2)]+g_I[i+4-(aux*2)]+g_I[i+5-(aux*2)]+g_I[i+6-(aux*2)]+g_I[i+7-(aux*2)]+
            g_I[i-(aux*3)]+g_I[i-1-(aux*3)]+g_I[i-2-(aux*3)]+g_I[i-3-(aux*3)]+g_I[i-4-(aux*3)]+g_I[i+1-(aux*3)]+g_I[i+2-(aux*3)]+g_I[i+3-(aux*3)]+g_I[i+4-(aux*3)]+g_I[i+5-(aux*3)]+g_I[i+6-(aux*3)]+g_I[i+7-(aux*3)]+
            g_I[i+aux]+g_I[i-1+aux]+g_I[i-2+aux]+g_I[i-3+aux]+g_I[i-4+aux]+g_I[i+1+aux]+g_I[i+2+aux]+g_I[i+3+aux]+g_I[i+4+aux]+g_I[i+5+aux]+g_I[i+6+aux]+g_I[i+7+aux]+
            g_I[i+(aux*2)]+g_I[i-1+(aux*2)]+g_I[i-2+(aux*2)]+g_I[i-3+(aux*2)]+g_I[i-4+(aux*2)]+g_I[i+1+(aux*2)]+g_I[i+2+(aux*2)]+g_I[i+3+(aux*2)]+g_I[i+4+(aux*2)]+g_I[i+5+(aux*2)]+g_I[i+6+(aux*2)]+g_I[i+7+(aux*2)]+
            g_I[i+(aux*3)]+g_I[i-1+(aux*3)]+g_I[i-2+(aux*3)]+g_I[i-3+(aux*3)]+g_I[i-4+(aux*3)]+g_I[i+1+(aux*3)]+g_I[i+2+(aux*3)]+g_I[i+3+(aux*3)]+g_I[i+4+(aux*3)]+g_I[i+5+(aux*3)]+g_I[i+6+(aux*3)]+g_I[i+7+(aux*3)]+
 g_I[i+(aux*4)]+g_I[i-1+(aux*4)]+g_I[i-2+(aux*4)]+g_I[i-3+(aux*4)]+g_I[i-4+(aux*4)]+g_I[i-5+(aux*4)]+g_I[i-6+(aux*4)]+g_I[i-7+(aux*4)]
+g_I[i+1+(aux*4)]+g_I[i+2+(aux*4)]+g_I[i+3+(aux*4)]+g_I[i+4+(aux*4)] +g_I[i+5+(aux*4)] +g_I[i+6+(aux*4)]
+ g_I[i-(aux*4)]+g_I[i-1-(aux*4)]+g_I[i-2-(aux*4)]+g_I[i-3-(aux*4)]+g_I[i-4-(aux*4)]+g_I[i-5-(aux*4)]+g_I[i-6-(aux*4)]+g_I[i-7-(aux*4)]
+g_I[i+1-(aux*4)]+g_I[i+2-(aux*4)]+g_I[i+3-(aux*4)]+g_I[i+4-(aux*4)] +g_I[i+5-(aux*4)] +g_I[i+6-(aux*4)] +g_I[i+7-(aux*4)]  +
 g_I[i+(aux*5)]+g_I[i-1+(aux*5)]+g_I[i-2+(aux*5)]+g_I[i-3+(aux*5)]+g_I[i-4+(aux*5)]+g_I[i-5+(aux*5)]+g_I[i-6+(aux*5)]+g_I[i-7+(aux*5)]
+g_I[i+1+(aux*5)]+g_I[i+2+(aux*5)]+g_I[i+3+(aux*5)]+g_I[i+4+(aux*5)] +g_I[i+5+(aux*5)]+g_I[i+6+(aux*5)]+g_I[i+7+(aux*5)]
+ g_I[i-(aux*5)]+g_I[i-1-(aux*5)]+g_I[i-2-(aux*5)]+g_I[i-3-(aux*5)]+g_I[i-4-(aux*5)]+g_I[i-5-(aux*5)]+g_I[i+1-(aux*5)]+g_I[i+2-(aux*5)]+g_I[i+3-(aux*5)]+g_I[i+4-(aux*5)] +g_I[i+5-(aux*5)]+g_I[i+6-(aux*5)]+g_I[i+7-(aux*5)]+
g_I[i+(aux*5)]+g_I[i-1+(aux*5)]+g_I[i-2+(aux*5)]+g_I[i-3+(aux*5)]+g_I[i-4+(aux*5)]+g_I[i-5+(aux*5)]+g_I[i-6+(aux*5)]+g_I[i-7+(aux*5)]
+g_I[i+1+(aux*6)]+g_I[i+2+(aux*6)]+g_I[i+3+(aux*6)]+g_I[i+4+(aux*6)] +g_I[i+5+(aux*6)]+g_I[i+6+(aux*6)]+g_I[i+7+(aux*6)]
+ g_I[i-(aux*6)]+g_I[i-1-(aux*6)]+g_I[i-2-(aux*6)]+g_I[i-3-(aux*6)]+g_I[i-4-(aux*6)]+g_I[i-5-(aux*6)]+g_I[i+1-(aux*6)]+g_I[i+2-(aux*6)]+g_I[i+3-(aux*6)]+g_I[i+4-(aux*6)] +g_I[i+5-(aux*6)]+g_I[i+6-(aux*6)]+g_I[i+7-(aux*6)]

+g_I[i+1+(aux*7)]+g_I[i+2+(aux*7)]+g_I[i+3+(aux*7)]+g_I[i+4+(aux*7)] +g_I[i+5+(aux*7)]+g_I[i+6+(aux*7)]+g_I[i+7+(aux*7)]
+ g_I[i-(aux*7)]+g_I[i-1-(aux*7)]+g_I[i-2-(aux*7)]+g_I[i-3-(aux*7)]+g_I[i-4-(aux*7)]+g_I[i-5-(aux*7)]+g_I[i+1-(aux*7)]+g_I[i+2-(aux*7)]+g_I[i+3-(aux*7)]+g_I[i+4-(aux*7)] +g_I[i+5-(aux*7)]+g_I[i+6-(aux*7)]+g_I[i+7-(aux*7)]
    )/225;

   	 }
	
	}//END FOR
	  // printf("TERMINA1   red %d  green %d blue %d\n", r_I[368676], g_I[368676],b_I[368676] );
	__syncthreads
	();
}

int main(int argc, char *argv[]) {


    if(argc < 4){
 	   printf("Por favor ingresar datos así: nombreimagen.png nuevaimagen.png #kernel #hilos #bloques\n");
      exit(0);}

	read_png_file(argv[1]);

	png_byte* row;
	png_byte desrow;
	png_byte desrow2;
	png_byte desrow3;
   png_byte* wrow;

    //int totalP = *width * *height;
    int numthreads = atoi(argv[4]);
    //int numblocks = atoi(argv[5]);
    char *res = (char*) malloc(30);
    int totalPixels = width * height;
    int x;
    int inputKernel = atoi(argv[3]);
     
    int kernel = inputKernel/2;
    int divi, begin, end, begin2, end2,tnum,id, p,fin;

    // Error code to check return values for CUDA calls
    cudaError_t err = cudaSuccess;

    // Print the vector length to be used, and compute its size

    size_t size = totalPixels * sizeof(float);

    // Allocate the host input vector R
    int *h_rI = (int *)malloc(size);

    // Allocate the host input vector G
    int *h_gI = (int *)malloc(size);

    // Allocate the host input vector B
    int *h_bI = (int *)malloc(size); 

    // Verify that allocations succeeded
    if (h_rI == NULL || h_gI == NULL || h_bI == NULL )
    {
        fprintf(stderr, "Failed to allocate host vectors!\n");
        exit(EXIT_FAILURE);
    }

    // Initialize the host input vectors
    x =0;
	for(int c=0; c<height; c++) {
		row = rowPointer[c];
		for(int d=0; d<width; d++){
			wrow = &(row[d*4]);
			desrow = wrow[0];
			desrow2 = wrow[1];
			desrow3 = wrow[2];
			h_rI[x] = desrow;
			h_gI[x] = desrow2;
			h_bI[x] = desrow3;

			//printf("%d %d %d\n", r[x], g[x],b[x] );

			// desrow = g[x];
			// desrow2 = b[x];
			// desrow3 = r[x];
			// wrow[0] = desrow;
			// wrow[1] = desrow2;
			// wrow[2] = desrow3;
			// row[d*4] = *wrow;
			x++;
		}
	}

    // Allocate the device input vector R
    int *d_rI = NULL;
    err = cudaMalloc((void **)&d_rI, size);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to allocate device vector r (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    // Allocate the device input vector G
    int *d_gI = NULL;
    err = cudaMalloc((void **)&d_gI, size);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to allocate device vector g (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    // Allocate the device input vector B
    int *d_bI = NULL;
    err = cudaMalloc((void **)&d_bI, size);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to allocate device vector b (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    // Allocate the device output vector R
    int *d_rO = NULL;
    err = cudaMalloc((void **)&d_rO, size);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to allocate device vector r (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    // Allocate the device output vector G
    int *d_gO = NULL;
    err = cudaMalloc((void **)&d_gO, size);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to allocate device vector g (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    // Allocate the device output vector B
    int *d_bO = NULL;
    err = cudaMalloc((void **)&d_bO, size);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to allocate device vector b (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    // Copy the host input vectors A and B in host memory to the device input vectors in
    // device memory
    //printf("Copy input data from the host memory to the CUDA device\n");
    err = cudaMemcpy(d_rI, h_rI, size, cudaMemcpyHostToDevice);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to copy vector r from host to device (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    err = cudaMemcpy(d_gI, h_gI, size, cudaMemcpyHostToDevice);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to copy vector g from host to device (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    err = cudaMemcpy(d_bI, h_bI, size, cudaMemcpyHostToDevice);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to copy vector b from host to device (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }




divi = (height*width/numthreads) ;
	float rest = height%numthreads;
		//printf("divi %i  rest %f height %i \n", divi,rest,height);
	end2 = divi;
	if (inputKernel == 3){begin2 = 1;
	  p = 1;
	   
	 }
	 if(inputKernel == 5){begin2 = 2;
	   p = 2;
	  
	}
	if(inputKernel == 7){begin2= 3;
		  p = 3;
		   
	}
	if(inputKernel == 9){begin2= 4;

		  p = 4;
		   
	}
	if(inputKernel == 11){begin2= 5;
		  p = 5;
		   
	}
	if(inputKernel == 13){begin2= 6;
		  p = 6;
		   
	}
	if(inputKernel == 15){
						begin2= 7;
		  p = 7;
		   
	  }
	fin = begin2;
	if (numthreads == 	1 ){
		 end2 = end2 - 7;
	}





    // Launch the Vector Add CUDA Kernel
    int threadsPerBlock = numthreads;
    int blocksPerGrid =(totalPixels + threadsPerBlock - 1) / threadsPerBlock;
    //printf("CUDA kernel launch with %d blocks of %d threads\n", blocksPerGrid, threadsPerBlock);


        myBlur3<<<1, numthreads>>>(d_rI, d_gI, d_bI, totalPixels, height,numthreads,begin2,end2,p,inputKernel,width);
    //myBlur<<<blocksPerGrid, threadsPerBlock>>>(d_rI, d_gI, d_bI, d_rO, d_gO, d_bO, totalPixels, kernel);
    err = cudaGetLastError();



















    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to launch myBlur kernel (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }



// printf("XX 2  red %d  green %d blue %d\n", h_rI[368676], h_gI[368676],h_bI[368676] );

    // Copy the device result vector in device memory to the host result vector
    // in host memory.
    //printf("Copy output data from the CUDA device to the host memory\n");

    err = cudaMemcpy(h_rI, d_rI, size, cudaMemcpyDeviceToHost);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to copy vector rI from device to host (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    err = cudaMemcpy(h_gI, d_gI, size, cudaMemcpyDeviceToHost);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to copy vector gI from device to host (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    err = cudaMemcpy(h_bI, d_bI, size, cudaMemcpyDeviceToHost);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to copy vector bI from device to host (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }


 //printf("TERNA  red %d  green %d blue %d\n", h_rI[368676], h_gI[368676],h_bI[368676] );




    x =0;
	for(int c=0; c<height; c++) {
		row = rowPointer[c];
		for(int d=0; d<width; d++){
			wrow = &(row[d*4]);
			// desrow = wrow[0];
			// desrow2 = wrow[1];
			// desrow3 = wrow[2];
			// h_rI[x] = desrow;
			// h_gI[x] = desrow2;
			// h_bI[x] = desrow3;

			//printf("%d %d %d\n", r[x], g[x],b[x] );

			desrow = h_rI[x];
			desrow2 = h_gI[x];
			desrow3 = h_bI[x];
			wrow[0] = desrow;
			wrow[1] = desrow2;
			wrow[2] = desrow3;
			row[d*4] = *wrow;
			x++;
		}
	}

    //printf("Test PASSED\n");




	write_png_file(argv[2]);





    // Free device global memory
    err = cudaFree(d_rI);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to free device vector rI (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    err = cudaFree(d_gI);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to free device vector gI (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }

    err = cudaFree(d_bI);

    if (err != cudaSuccess)
    {
        fprintf(stderr, "Failed to free device vector bI (error code %s)!\n", cudaGetErrorString(err));
        exit(EXIT_FAILURE);
    }


    // Free host memory
    free(h_rI);
    free(h_gI);
    free(h_bI);


	return(0);
}
